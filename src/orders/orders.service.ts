import {
  BadRequestException,
  ConflictException,
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
  OrderStatus,
  payment_method,
  payment_status,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
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

type VariantRequirement = {
  variant: VariantWithProduct;
  quantity: number;
};

type PriceChangeDetail =
  | {
      variant_id: string;
      old_price_vnd: number | null;
      new_price_vnd: number;
    }
  | {
      combo_id: string;
      old_unit_price_vnd: number | null;
      new_unit_price_vnd: number;
    };

type StockIssueDetail = {
  variant_id: string;
  requested_qty: number;
  available_stock: number;
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
      throw new ConflictException(
        this.buildErrorPayload(
          'IDEMPOTENCY_IN_PROGRESS',
          'Checkout request with this key is already being processed. Please retry later.',
        ),
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

    const priceChangeItems: PriceChangeDetail[] = [];
    const variantRequirements = new Map<string, VariantRequirement>();
    const computedItems: ComputedItem[] = [];

    for (const item of dto.items) {
      if (item.variant_id) {
        const variant = variantMap.get(item.variant_id);
        if (!variant) {
          throw new BadRequestException(
            this.buildErrorPayload(
              'INVALID_VARIANT',
              'Biến thể sản phẩm không tồn tại hoặc không khả dụng.',
            ),
          );
        }

        if (BigInt(item.price_version) !== variant.price_version) {
          priceChangeItems.push({
            variant_id: variant.id,
            old_price_vnd: item.client_price_vnd ?? null,
            new_price_vnd: variant.price_vnd,
          });
          continue;
        }

        computedItems.push(this.buildVariantItem(variant, item.quantity));
        this.accumulateVariantRequirement(
          variantRequirements,
          variant,
          item.quantity,
        );
        continue;
      }

      const combo = comboMap.get(item.combo_id as string);
      if (!combo || !combo.is_active) {
        throw new BadRequestException(
          this.buildErrorPayload(
            'INVALID_COMBO',
            'Combo không khả dụng.',
          ),
        );
      }

      const comboPricing = this.buildComboPricingData(combo);

      if (BigInt(item.price_version) !== combo.price_version) {
        priceChangeItems.push({
          combo_id: combo.id,
          old_unit_price_vnd: item.client_price_vnd ?? null,
          new_unit_price_vnd: comboPricing.unitPrice,
        });
        continue;
      }

      computedItems.push({
        comboId: combo.id,
        title: combo.name,
        unitPrice: comboPricing.unitPrice,
        quantity: item.quantity,
        lineTotal: comboPricing.unitPrice * item.quantity,
        componentSnapshot: comboPricing.componentSnapshot,
      });

      for (const component of combo.components) {
        const componentVariant = component.variant as VariantWithProduct;
        const requiredQty = item.quantity * component.quantity;
        this.accumulateVariantRequirement(
          variantRequirements,
          componentVariant,
          requiredQty,
        );
      }
    }

    if (priceChangeItems.length) {
      this.throwPriceChanged(priceChangeItems);
    }

    if (!computedItems.length) {
      throw new BadRequestException(
        this.buildErrorPayload(
          'NO_VALID_ITEMS',
          'Giỏ hàng không có sản phẩm hợp lệ.',
        ),
      );
    }

    const stockIssues = this.detectStockIssues(variantRequirements);
    if (stockIssues.length) {
      this.throwOutOfStock(stockIssues);
    }

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
        for (const requirement of variantRequirements.values()) {
          const updateResult = await tx.product_variants.updateMany({
            where: {
              id: requirement.variant.id,
              stock: { gte: requirement.quantity },
            },
            data: { stock: { decrement: requirement.quantity } },
          });

          if (updateResult.count !== 1) {
            const latest = await tx.product_variants.findUnique({
              where: { id: requirement.variant.id },
              select: { stock: true },
            });
            this.throwOutOfStock([
              {
                variant_id: requirement.variant.id,
                requested_qty: requirement.quantity,
                available_stock: latest?.stock ?? 0,
              },
            ]);
          }
        }

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
            order_status: OrderStatus.CREATED,
            payment_reference: orderCode,
            items: {
              create: computedItems.map((item) => ({
                variant_id: item.variantId,
                combo_id: item.comboId,
                title_snapshot: item.title,
                unit_price_vnd: item.unitPrice,
                quantity: item.quantity,
                line_total_vnd: item.lineTotal,
                component_snapshot: item.componentSnapshot ?? undefined,
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

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        this.buildErrorPayload(
          'UNKNOWN_ERROR',
          'Unexpected error while processing checkout.',
        ),
      );
    }
  }

  async getPaymentIntent(code: string): Promise<PaymentIntentResponseDto> {
    const order = await this.prisma.orders.findUnique({
      where: { code },
    });

    if (!order) {
      throw new NotFoundException(
        this.buildErrorPayload('ORDER_NOT_FOUND', 'Order not found'),
      );
    }

    if (order.payment_status !== payment_status.PENDING) {
      throw new BadRequestException(
        this.buildErrorPayload(
          'ORDER_NOT_PENDING',
          'Order payment is not pending.',
        ),
      );
    }

    const bankCode = this.config.get<string>('PAYMENT_BANK_CODE');
    const bankName = this.config.get<string>('PAYMENT_BANK_NAME');
    const accountNumber =
      this.config.get<string>('PAYMENT_ACCOUNT_NUMBER') ??
      this.config.get<string>('PAYMENT_ACCOUNT_NO');
    const accountName = this.config.get<string>('PAYMENT_ACCOUNT_NAME');

    if (!bankCode || !bankName || !accountNumber || !accountName) {
      throw new InternalServerErrorException(
        this.buildErrorPayload(
          'PAYMENT_ACCOUNT_NOT_CONFIGURED',
          'Payment account information is missing.',
        ),
      );
    }

    const transferContent = order.payment_reference ?? order.code;

    return {
      order_code: order.code,
      payment_status: order.payment_status,
      amount_vnd: order.grand_total_vnd,
      transfer_content: transferContent,
      bank: {
        code: bankCode,
        name: bankName,
        account_number: accountNumber,
        account_name: accountName,
      },
    };
  }

  private buildVariantItem(
    variant: VariantWithProduct,
    quantity: number,
  ): ComputedItem {
    const unitPrice = variant.price_vnd;
    const title = this.buildVariantTitle(variant);

    return {
      variantId: variant.id,
      title,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
    };
  }

  private buildComboPricingData(combo: ComboWithComponents) {
    let componentTotal = 0;
    const componentSnapshot = combo.components.map((component) => {
      const componentPrice =
        component.unit_price_override_vnd ?? component.variant.price_vnd;
      componentTotal += componentPrice * component.quantity;
      return {
        variant_id: component.variant_id,
        sku: component.variant.sku,
        quantity: component.quantity,
        unit_price_vnd: componentPrice,
        price_version: Number(component.variant.price_version),
      };
    });

    const unitPrice = this.calculateComboPrice(combo, componentTotal);

    return { unitPrice, componentSnapshot };
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

  private accumulateVariantRequirement(
    requirements: Map<string, VariantRequirement>,
    variant: VariantWithProduct,
    quantity: number,
  ) {
    const existing = requirements.get(variant.id);
    if (existing) {
      existing.quantity += quantity;
      return;
    }
    requirements.set(variant.id, { variant, quantity });
  }

  private detectStockIssues(
    requirements: Map<string, VariantRequirement>,
  ): StockIssueDetail[] {
    const shortages: StockIssueDetail[] = [];
    for (const requirement of requirements.values()) {
      if (requirement.variant.stock < requirement.quantity) {
        shortages.push({
          variant_id: requirement.variant.id,
          requested_qty: requirement.quantity,
          available_stock: requirement.variant.stock,
        });
      }
    }
    return shortages;
  }

  private throwPriceChanged(items: PriceChangeDetail[]): never {
    throw new HttpException(
      this.buildErrorPayload(
        'PRICE_CHANGED',
        'Giá sản phẩm đã thay đổi, vui lòng xem lại giỏ hàng.',
        { items },
      ),
      HttpStatus.CONFLICT,
    );
  }

  private throwOutOfStock(items: StockIssueDetail[]): never {
    throw new HttpException(
      this.buildErrorPayload(
        'OUT_OF_STOCK',
        'Một số sản phẩm không đủ tồn kho.',
        { items },
      ),
      HttpStatus.CONFLICT,
    );
  }

  private buildErrorPayload(
    errorCode: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    const payload: {
      error_code: string;
      message: string;
      details?: Record<string, unknown>;
    } = {
      error_code: errorCode,
      message,
    };

    if (details) {
      payload.details = details;
    }

    return payload;
  }

  private toOrderResponse(order: OrderWithItems): OrderResponseDto {
    return {
      code: order.code,
      full_name: order.full_name,
      phone: order.phone,
      fulfillment_type: order.fulfillment_type,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      order_status: order.order_status,
      grand_total_vnd: order.grand_total_vnd,
      items: order.items.map((item) => ({
        title: item.title_snapshot,
        variant_id: item.variant_id,
        combo_id: item.combo_id,
        unit_price_vnd: item.unit_price_vnd,
        quantity: item.quantity,
        line_total_vnd: item.line_total_vnd,
      })),
      delivery_attempts: order.delivery_attempts,
      delivery_failed_at: order.delivery_failed_at ?? undefined,
      delivery_failed_reason: order.delivery_failed_reason ?? undefined,
      fulfilled_at: order.fulfilled_at ?? undefined,
      cancelled_at: order.cancelled_at ?? undefined,
      cancelled_reason: order.cancelled_reason ?? undefined,
    };
  }
}
