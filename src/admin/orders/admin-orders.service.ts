import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  fulfillment_type,
  payment_status,
  shipment_status,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdminCancelOrderDto,
  AdminConfirmPaymentDto,
  AdminDeliverOrderDto,
  AdminOrderListQueryDto,
} from './dto/admin-order.dto';

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminOrderListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ordersWhereInput = {};

    if (query.paymentStatus) {
      where.payment_status = query.paymentStatus;
    }
    if (query.fulfillmentType) {
      where.fulfillment_type = query.fulfillmentType;
    }
    if (query.from || query.to) {
      const createdAtFilter: Prisma.DateTimeFilter = {};
      if (query.from) {
        createdAtFilter.gte = query.from;
      }
      if (query.to) {
        createdAtFilter.lte = query.to;
      }
      where.created_at = createdAtFilter;
    }
    if (query.q) {
      where.OR = [
        { code: { contains: query.q, mode: 'insensitive' } },
        { full_name: { contains: query.q, mode: 'insensitive' } },
        { phone: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
      ] as Prisma.ordersWhereInput[];
    }

    const [total, data] = await Promise.all([
      this.prisma.orders.count({ where }),
      this.prisma.orders.findMany({
        where,
        include: this.orderInclude(),
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, data };
  }

  async getByCode(code: string) {
    const order = await this.prisma.orders.findUnique({
      where: { code },
      include: this.orderInclude(),
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async confirmPayment(code: string, dto: AdminConfirmPaymentDto) {
    const order = await this.prisma.orders.findUnique({
      where: { code },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.payment_status !== payment_status.PENDING) {
      throw new BadRequestException('Order is not pending payment');
    }

    const force = dto.force ?? false;
    if (!force && dto.amountVnd !== order.grand_total_vnd) {
      throw new BadRequestException('Amount does not match order total');
    }

    if (dto.transactionId) {
      const duplicate = await this.prisma.payments.findFirst({
        where: { transaction_id: dto.transactionId },
      });
      if (duplicate) {
        throw new ConflictException('Transaction ID already used');
      }
    }

    const paidAt = dto.paidAt ?? new Date();
    const providerPayload = dto.providerPayload
      ? { ...dto.providerPayload }
      : undefined;

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const pendingPayment = await tx.payments.findFirst({
        where: { order_id: order.id, status: payment_status.PENDING },
        orderBy: { created_at: 'desc' },
      });

      if (pendingPayment) {
        await tx.payments.update({
          where: { id: pendingPayment.id },
          data: {
            status: payment_status.SUCCESS,
            amount_vnd: dto.amountVnd,
            transaction_id: dto.transactionId ?? null,
            provider_payload: providerPayload,
            paid_at: paidAt,
          },
        });
      } else {
        await tx.payments.create({
          data: {
            order_id: order.id,
            status: payment_status.SUCCESS,
            method: order.payment_method,
            amount_vnd: dto.amountVnd,
            transaction_id: dto.transactionId ?? null,
            provider_payload: providerPayload,
            paid_at: paidAt,
            reference_code: order.code,
          },
        });
      }

      const updated = await tx.orders.update({
        where: { id: order.id },
        data: {
          payment_status: payment_status.SUCCESS,
          paid_at: paidAt,
        },
        include: this.orderInclude(),
      });

      await tx.audit_logs.create({
        data: {
          actor_user_id: null,
          action: force ? 'FORCE_CONFIRM_PAYMENT' : 'CONFIRM_PAYMENT',
          entity: 'ORDER',
          entity_id: order.id,
          details: {
            code: order.code,
            amount_vnd: dto.amountVnd,
            transaction_id: dto.transactionId ?? null,
            force,
            paid_at: paidAt,
            provider_payload: providerPayload ?? null,
          },
        },
      });

      return updated;
    });

    return updatedOrder;
  }

  async cancel(code: string, dto: AdminCancelOrderDto) {
    const order = await this.prisma.orders.findUnique({
      where: { code },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.payment_status !== payment_status.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.orders.update({
        where: { id: order.id },
        data: {
          payment_status: payment_status.FAILED,
        },
        include: this.orderInclude(),
      });

      await tx.audit_logs.create({
        data: {
          actor_user_id: null,
          action: 'CANCEL_ORDER',
          entity: 'ORDER',
          entity_id: order.id,
          details: { code: order.code, reason: dto.reason ?? null },
        },
      });

      return updated;
    });

    return updatedOrder;
  }

  async markDelivered(code: string, dto: AdminDeliverOrderDto) {
    const order = await this.prisma.orders.findUnique({
      where: { code },
      include: { shipment: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.payment_status !== payment_status.SUCCESS) {
      throw new BadRequestException('Only paid orders can be delivered');
    }

    const deliveredAt = dto.deliveredAt ?? new Date();
    const status = dto.shipmentStatus ?? shipment_status.DELIVERED;

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      if (order.shipment) {
        await tx.shipments.update({
          where: { id: order.shipment.id },
          data: {
            status,
            delivered_at: deliveredAt,
            proof: dto.note ? { note: dto.note } : undefined,
          },
        });
      } else {
        await tx.shipments.create({
          data: {
            order_id: order.id,
            status,
            delivered_at: deliveredAt,
            proof: dto.note ? { note: dto.note } : undefined,
          },
        });
      }

      const fresh = await tx.orders.findUnique({
        where: { id: order.id },
        include: this.orderInclude(),
      });

      await tx.audit_logs.create({
        data: {
          actor_user_id: null,
          action: 'MARK_DELIVERED',
          entity: 'ORDER',
          entity_id: order.id,
          details: {
            code: order.code,
            delivered_at: deliveredAt,
            shipment_status: status,
            note: dto.note ?? null,
          },
        },
      });

      return fresh;
    });

    return updatedOrder;
  }

  private orderInclude() {
    return {
      items: true,
      payments: true,
      shipment: true,
    };
  }
}
