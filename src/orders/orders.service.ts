import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Prisma,
  combo_pricing_type,
  fulfillment_type,
  payment_method,
  payment_status,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutOrderDto, CheckoutItemDto } from './dto/checkout-order.dto';
import { generateOrderCode } from './helpers/order-code.helper';
import { OrderResponseDto } from './dto/order-response.dto';
import { PaymentIntentResponseDto } from './dto/payment-intent-response.dto';

type VariantWithProduct = Prisma.product_variantsGetPayload<{
  include: { product: true };
}>;

type ComboWithComponents = Prisma.combosGetPayload<{
  include: { components: { include: { variant: { include: { product: true } } } } };
}>;

type OrderWithItems = Prisma.ordersGetPayload<{ include: { items: true } }>;

type ComputedItem = {
  variantId?: string;
  comboId?: string;
  title: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  componentSnapshot?: unknown;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async checkout(dto: CheckoutOrderDto): Promise<OrderResponseDto> {
    const existed = await this.prisma.idempotency_keys.findFirst({
      where: { scope: dto.idem_scope, key: dto.idem_key },
    });

    if (existed?.order_code) {
      const order = await this.prisma.orders.findFirst({
        where: { code: existed.order_code },
        include: { items: true },
      });
      if (order) {
        return this.toOrderResponse(order);
      }
    }

    if (existed) {
      throw new HttpException(
        {
          code: 'IDEMPOTENCY_IN_PROGRESS',
          message: 'Checkout đang được xử lý, vui lòng thử lại sau.',
        },
        HttpStatus.CONFLICT,
      );
    }

    const variantIds = dto.items
      .filter((item) => item.variant_id)
      .map((item) => item.variant_id as string);
    const comboIds = dto.items
      .filter((item) => item.combo_id)
      .map((item) => item.combo_id as string);

    const [variants, combos] = await Promise.all([
      variantIds.length
        ? this.prisma.product_variants.findMany({
            where: { id: { in: variantIds } },
            include: { product: true },
          })
        : [],
      comboIds.length
        ? this.prisma.combos.findMany({
            where: { id: { in: comboIds } },
            include: {
              components: {
                include: { variant: { include: { product: true } } },
              },
            },
          })
        : [],
    ]);

    const variantMap = new Map<string, VariantWithProduct>(
      variants.map(
        (variant) => [variant.id, variant] as [string, VariantWithProduct],
      ),
    );
    const comboMap = new Map<string, ComboWithComponents>(
      combos.map((combo) => [combo.id, combo] as [string, ComboWithComponents]),
    );

    const computedItems = dto.items.map((item) =>
      item.variant_id
        ? this.buildVariantItem(item, variantMap)
        : this.buildComboItem(item, comboMap),
    );

    const subtotal = computedItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );
    const totalQuantity = computedItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const orderTitle =
      computedItems.length === 1
        ? computedItems[0].title
        : `${computedItems[0].title} + ${computedItems.length - 1} mục`;
    const fulfillmentType =
      dto.fulfillment_type ?? fulfillment_type.PICKUP_SCHOOL;
    const paymentMethod = dto.payment_method ?? payment_method.VIETQR;
    const orderCode = generateOrderCode();

    try {
      const order = await this.prisma.$transaction(async (tx) => {
        const createdOrder = await tx.orders.create({
          data: {
            code: orderCode,
            order_title: orderTitle,
            quantity: totalQuantity,
            fulfillment_type: fulfillmentType,
            full_name: dto.full_name,
            phone: dto.phone,
            email: dto.email,
            address: dto.address,
            note: dto.note,
            grand_total_vnd: subtotal,
            payment_method: paymentMethod,
            payment_status: payment_status.PENDING,
            payment_reference: orderCode,
            items: {
              create: computedItems.map((item) => ({
                variant_id: item.variantId,
                combo_id: item.comboId,
                title_snapshot: item.title,
                unit_price_vnd: item.unitPrice,
                quantity: item.quantity,
                line_total_vnd: item.lineTotal,
                component_snapshot:
                  item.componentSnapshot ?? undefined,
              })),
            },
          },
          include: { items: true },
        });

        await tx.idempotency_keys.create({
          data: {
            scope: dto.idem_scope,
            key: dto.idem_key,
            order_code: createdOrder.code,
          },
        });

        return createdOrder;
      });

      return this.toOrderResponse(order);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existedKey = await this.prisma.idempotency_keys.findFirst({
          where: { scope: dto.idem_scope, key: dto.idem_key },
        });
        if (existedKey?.order_code) {
          const found = await this.prisma.orders.findFirst({
            where: { code: existedKey.order_code },
            include: { items: true },
          });
          if (found) {
            return this.toOrderResponse(found);
          }
        }
      }
      throw error;
    }
  }

  async getPaymentIntent(code: string): Promise<PaymentIntentResponseDto> {
    const order = await this.prisma.orders.findUnique({
      where: { code },
    });

    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    }

    if (order.payment_status !== payment_status.PENDING) {
      throw new BadRequestException({
        code: 'ORDER_NOT_PENDING',
        message: 'Order is not in PENDING state',
      });
    }

    const bankCode = this.config.get<string>('PAYMENT_BANK_CODE');
    const accountNo = this.config.get<string>('PAYMENT_ACCOUNT_NO');
    const accountName = this.config.get<string>('PAYMENT_ACCOUNT_NAME');

    if (!bankCode || !accountNo || !accountName) {
      throw new InternalServerErrorException({
        code: 'PAYMENT_ACCOUNT_NOT_CONFIGURED',
        message: 'Payment account information is missing.',
      });
    }

    const transferContent = order.payment_reference ?? order.code;

    return {
      order_code: order.code,
      amount_vnd: order.grand_total_vnd,
      bank_code: bankCode,
      account_no: accountNo,
      account_name: accountName,
      transfer_content: transferContent,
    };
  }

  private buildVariantItem(
    item: CheckoutItemDto,
    variantMap: Map<string, VariantWithProduct>,
  ): ComputedItem {
    const variant = variantMap.get(item.variant_id as string);
    if (!variant) {
      throw new BadRequestException('Biến thể sản phẩm không tồn tại.');
    }

    if (BigInt(item.price_version) !== variant.price_version) {
      this.throwPriceChanged();
    }

    const unitPrice = variant.price_vnd;
    const title = this.buildVariantTitle(variant);

    return {
      variantId: variant.id,
      title,
      unitPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
    };
  }

  private buildComboItem(
    item: CheckoutItemDto,
    comboMap: Map<string, ComboWithComponents>,
  ): ComputedItem {
    const combo = comboMap.get(item.combo_id as string);
    if (!combo || !combo.is_active) {
      throw new BadRequestException('Combo không khả dụng.');
    }

    if (BigInt(item.price_version) !== combo.price_version) {
      this.throwPriceChanged();
    }

    const componentTotal = combo.components.reduce((sum, component) => {
      const componentPrice =
        component.unit_price_override_vnd ?? component.variant.price_vnd;
      return sum + componentPrice * component.quantity;
    }, 0);

    const unitPrice = this.calculateComboPrice(combo, componentTotal);
    const title = combo.name;

    return {
      comboId: combo.id,
      title,
      unitPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
      componentSnapshot: combo.components.map((component) => ({
        variant_id: component.variant_id,
        sku: component.variant.sku,
        quantity: component.quantity,
        unit_price_vnd:
          component.unit_price_override_vnd ?? component.variant.price_vnd,
        price_version: Number(component.variant.price_version),
      })),
    };
  }

  private calculateComboPrice(
    combo: ComboWithComponents,
    componentTotal: number,
  ): number {
    let computedPrice = 0;

    switch (combo.pricing_type) {
      case combo_pricing_type.FIXED_PRICE:
        computedPrice = combo.list_price_vnd;
        break;
      case combo_pricing_type.SUM_COMPONENTS:
        computedPrice = componentTotal;
        break;
      case combo_pricing_type.SUM_MINUS_AMOUNT:
        computedPrice = componentTotal - combo.amount_off_vnd;
        break;
      case combo_pricing_type.SUM_MINUS_PERCENT:
        computedPrice = Math.round(
          (componentTotal * (100 - combo.percent_off)) / 100,
        );
        break;
      default:
        computedPrice = componentTotal;
    }

    return Math.max(computedPrice, 0);
  }

  private buildVariantTitle(variant: VariantWithProduct): string {
    const baseName = variant.product?.name ?? variant.sku;
    const options = [variant.option1, variant.option2]
      .filter((option) => Boolean(option))
      .join(' ')
      .trim();
    return options ? `${baseName} ${options}` : baseName;
  }

  private throwPriceChanged(): never {
    throw new HttpException(
      {
        code: 'PRICE_CHANGED',
        message: 'Giá sản phẩm đã thay đổi, vui lòng tải lại giỏ hàng.',
      },
      HttpStatus.CONFLICT,
    );
  }

  private toOrderResponse(order: OrderWithItems): OrderResponseDto {
    return {
      code: order.code,
      full_name: order.full_name,
      phone: order.phone,
      fulfillment_type: order.fulfillment_type,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      grand_total_vnd: order.grand_total_vnd,
      items: order.items.map((item) => ({
        title: item.title_snapshot,
        variant_id: item.variant_id,
        combo_id: item.combo_id,
        unit_price_vnd: item.unit_price_vnd,
        quantity: item.quantity,
        line_total_vnd: item.line_total_vnd,
      })),
    };
  }
}
