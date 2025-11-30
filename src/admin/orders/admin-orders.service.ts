import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  Prisma,
  fulfillment_type,
  payment_status,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdminConfirmPaymentDto,
  AdminOrderListQueryDto,
} from './dto/admin-order.dto';
import {
  AdminCancelOrderDto,
  AdminCompleteFulfilmentDto,
  AdminFailFulfilmentDto,
  AdminRetryFulfilmentDto,
  AdminStartFulfilmentDto,
} from './dto/admin-fulfilment.dto';

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
          order_status: OrderStatus.PAID,
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

  async startFulfilment(code: string, dto: AdminStartFulfilmentDto) {
    const order = await this.loadOrder(code);
    this.ensureTransition(
      order.order_status,
      [OrderStatus.PAID],
      OrderStatus.FULFILLING,
    );

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.orders.update({
        where: { id: order.id },
        data: { order_status: OrderStatus.FULFILLING },
        include: this.orderInclude(),
      });

      await tx.audit_logs.create({
        data: {
          actor_user_id: null,
          action: 'FULFILMENT_START',
          entity: 'ORDER',
          entity_id: order.id,
          details: {
            code: order.code,
            note: dto.note ?? null,
          },
        },
      });

      return updated;
    });

    return updatedOrder;
  }

  async failFulfilment(code: string, dto: AdminFailFulfilmentDto) {
    const order = await this.loadOrder(code);
    this.ensureTransition(
      order.order_status,
      [OrderStatus.FULFILLING],
      OrderStatus.DELIVERY_FAILED,
    );

    const now = new Date();

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.orders.update({
        where: { id: order.id },
        data: {
          order_status: OrderStatus.DELIVERY_FAILED,
          delivery_failed_at: now,
          delivery_failed_reason: dto.reason_code,
          delivery_attempts: order.delivery_attempts + 1,
        },
        include: this.orderInclude(),
      });

      await tx.audit_logs.create({
        data: {
          actor_user_id: null,
          action: 'FULFILMENT_FAIL',
          entity: 'ORDER',
          entity_id: order.id,
          details: {
            code: order.code,
            reason_code: dto.reason_code,
            note: dto.note ?? null,
            delivery_attempts: updated.delivery_attempts,
          },
        },
      });

      return updated;
    });

    return updatedOrder;
  }

  async retryFulfilment(code: string, dto: AdminRetryFulfilmentDto) {
    const order = await this.loadOrder(code);
    this.ensureTransition(
      order.order_status,
      [OrderStatus.DELIVERY_FAILED],
      OrderStatus.FULFILLING,
    );

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.orders.update({
        where: { id: order.id },
        data: { order_status: OrderStatus.FULFILLING },
        include: this.orderInclude(),
      });

      await tx.audit_logs.create({
        data: {
          actor_user_id: null,
          action: 'FULFILMENT_RETRY',
          entity: 'ORDER',
          entity_id: order.id,
          details: {
            code: order.code,
            note: dto.note ?? null,
          },
        },
      });

      return updated;
    });

    return updatedOrder;
  }

  async completeFulfilment(code: string, dto: AdminCompleteFulfilmentDto) {
    const order = await this.loadOrder(code);
    this.ensureTransition(
      order.order_status,
      [OrderStatus.FULFILLING],
      OrderStatus.FULFILLED,
    );

    const fulfilledAt = dto.fulfilled_at
      ? new Date(dto.fulfilled_at)
      : new Date();
    if (Number.isNaN(fulfilledAt.getTime())) {
      throw new BadRequestException('fulfilled_at must be a valid ISO string');
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.orders.update({
        where: { id: order.id },
        data: {
          order_status: OrderStatus.FULFILLED,
          fulfilled_at: fulfilledAt,
        },
        include: this.orderInclude(),
      });

      await tx.audit_logs.create({
        data: {
          actor_user_id: null,
          action: 'FULFILMENT_COMPLETE',
          entity: 'ORDER',
          entity_id: order.id,
          details: {
            code: order.code,
            note: dto.note ?? null,
            fulfilled_at: fulfilledAt,
          },
        },
      });

      return updated;
    });

    return updatedOrder;
  }

  async cancel(code: string, dto: AdminCancelOrderDto) {
    const order = await this.loadOrder(code);

    this.ensureTransition(
      order.order_status,
      [
        OrderStatus.CREATED,
        OrderStatus.PAID,
        OrderStatus.FULFILLING,
        OrderStatus.DELIVERY_FAILED,
      ],
      OrderStatus.CANCELLED,
    );

    const cancelledAt = new Date();

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.orders.update({
        where: { id: order.id },
        data: {
          order_status: OrderStatus.CANCELLED,
          cancelled_at: cancelledAt,
          cancelled_reason: dto.reason,
        },
        include: this.orderInclude(),
      });

      await tx.audit_logs.create({
        data: {
          actor_user_id: null,
          action: 'CANCEL_ORDER',
          entity: 'ORDER',
          entity_id: order.id,
          details: {
            code: order.code,
            reason: dto.reason,
          },
        },
      });

      return updated;
    });

    return updatedOrder;
  }

  private async loadOrder(code: string) {
    const order = await this.prisma.orders.findUnique({ where: { code } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  private ensureTransition(
    current: OrderStatus,
    allowed: OrderStatus[],
    target: OrderStatus,
  ) {
    if (!allowed.includes(current)) {
      throw new ConflictException({
        error_code: 'INVALID_STATUS_TRANSITION',
        message: `Cannot change order_status from ${current} to ${target}.`,
        details: { from: current, to: target },
      });
    }
  }

  private orderInclude() {
    return {
      items: true,
      payments: true,
      shipment: true,
    };
  }
}
