import { BadRequestException, Injectable } from '@nestjs/common';
import { payment_status } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async confirm(dto: ConfirmPaymentDto) {
    const order = await this.prisma.orders.findFirst({
      where: { code: dto.order_code },
    });

    if (!order) {
      throw new BadRequestException({
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

    const force = dto.force ?? false;
    if (!force && dto.amount_vnd !== order.grand_total_vnd) {
      throw new BadRequestException({
        code: 'AMOUNT_MISMATCH',
        message: 'Amount does not match order total',
      });
    }

    if (dto.transaction_id) {
      const duplicate = await this.prisma.payments.findFirst({
        where: { transaction_id: dto.transaction_id },
      });
      if (duplicate) {
        throw new BadRequestException({
          code: 'DUPLICATE_TRANSACTION_ID',
          message: 'Transaction ID already exists',
        });
      }
    }

    const paidAt = new Date();
    const action = force ? 'FORCE_CONFIRM' : 'CONFIRM_PAYMENT';

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.payments.create({
        data: {
          order_id: order.id,
          method: order.payment_method,
          status: payment_status.SUCCESS,
          amount_vnd: dto.amount_vnd,
          transaction_id: dto.transaction_id ?? null,
          reference_code: dto.reference_code ?? order.code,
          paid_at: paidAt,
        },
      });

      const updatedOrder = await tx.orders.update({
        where: { id: order.id },
        data: {
          payment_status: payment_status.SUCCESS,
          paid_at: paidAt,
        },
      });

      await tx.audit_logs.create({
        data: {
          actor_user_id: null,
          action,
          entity: 'ORDER',
          entity_id: order.id,
          details: {
            amount_vnd: dto.amount_vnd,
            force,
            reason: dto.reason ?? null,
            transaction_id: dto.transaction_id ?? null,
          },
        },
      });

      return updatedOrder;
    });

    return {
      ok: true,
      order_code: result.code,
      payment_status: result.payment_status,
    };
  }
}
