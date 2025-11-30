import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { payment_status } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async confirm(
    dto: ConfirmPaymentDto,
    adminUserId: string | null,
  ) {
    const order = await this.prisma.orders.findFirst({
      where: { code: dto.order_code },
    });

    if (!order) {
      throw new NotFoundException({
        error_code: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    }

    if (order.payment_status !== payment_status.PENDING) {
      throw new BadRequestException({
        error_code: 'ORDER_NOT_PENDING',
        message: 'Order payment is not pending.',
      });
    }

    const force = dto.force ?? false;
    if (!force && dto.amount_vnd !== order.grand_total_vnd) {
      throw new BadRequestException({
        error_code: 'AMOUNT_MISMATCH',
        message: 'Paid amount does not match order total.',
        details: {
          amount_vnd: dto.amount_vnd,
          grand_total_vnd: order.grand_total_vnd,
        },
      });
    }

    const duplicate = await this.prisma.payments.findFirst({
      where: {
        transaction_id: dto.transaction_id,
        NOT: { status: payment_status.FAILED },
      },
    });
    if (duplicate) {
      throw new ConflictException({
        error_code: 'DUPLICATE_TRANSACTION_ID',
        message:
          'This transaction_id has already been used for another payment.',
      });
    }

    const paidAt = dto.paid_at ? new Date(dto.paid_at) : new Date();
    if (Number.isNaN(paidAt.getTime())) {
      throw new BadRequestException({
        error_code: 'INVALID_PAID_AT',
        message: 'paid_at must be a valid ISO 8601 timestamp.',
      });
    }

    const action = force ? 'FORCE_CONFIRM_PAYMENT' : 'CONFIRM_PAYMENT';

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      await tx.payments.create({
        data: {
          order_id: order.id,
          method: order.payment_method,
          status: payment_status.SUCCESS,
          amount_vnd: dto.amount_vnd,
          transaction_id: dto.transaction_id,
          reference_code: dto.reference_code ?? order.code,
          provider_payload: {
            reference_note: dto.reference_note ?? null,
          },
          paid_at: paidAt,
        },
      });

      const result = await tx.orders.update({
        where: { id: order.id },
        data: {
          payment_status: payment_status.SUCCESS,
          paid_at: paidAt,
        },
      });

      await tx.audit_logs.create({
        data: {
          actor_user_id: adminUserId,
          action,
          entity: 'ORDER',
          entity_id: order.id,
          details: {
            order_code: order.code,
            transaction_id: dto.transaction_id,
            amount_vnd: dto.amount_vnd,
            force,
            reason: dto.reason ?? null,
            reference_note: dto.reference_note ?? null,
            admin_user_id: adminUserId,
          },
        },
      });

      return result;
    });

    return {
      ok: true,
      order_code: updatedOrder.code,
      payment_status: updatedOrder.payment_status,
    };
  }
}
