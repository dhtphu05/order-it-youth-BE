import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, orders, teams } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { TeamOrderListQueryDto } from './dto/team-order-list-query.dto';
import { OrderResponseDto } from 'src/orders/dto/order-response.dto';

@Injectable()
export class TeamOrdersService {
  constructor(private readonly prisma: PrismaService) { }

  private toOrderResponseDto(order: orders): OrderResponseDto {
    return {
      code: order.code,
      full_name: order.full_name,
      phone: order.phone,
      fulfillment_type: order.fulfillment_type,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      order_status: order.order_status,
      delivery_attempts: order.delivery_attempts,
      delivery_failed_at: order.delivery_failed_at ?? undefined,
      delivery_failed_reason: order.delivery_failed_reason ?? undefined,
      fulfilled_at: order.fulfilled_at ?? undefined,
      cancelled_at: order.cancelled_at ?? undefined,
      cancelled_reason: order.cancelled_reason ?? undefined,
      grand_total_vnd: order.grand_total_vnd,
      items: (order as any).items.map((item) => ({
        title: item.title,
        variant_id: item.variant_id,
        combo_id: item.combo_id,
        unit_price_vnd: item.unit_price_vnd,
        quantity: item.quantity,
        line_total_vnd: item.line_total_vnd,
      })),
      team: (order as any).team
        ? {
          id: (order as any).team.id,
          code: (order as any).team.code,
          name: (order as any).team.name,
        }
        : undefined,
    };
  }

  async listOrdersForTeams(
    teamIds: string[],
    query: TeamOrderListQueryDto,
    isAdmin?: boolean,
  ) {
    if (teamIds.length === 0 && !isAdmin) {
      return {
        total: 0,
        page: query.page || 1,
        limit: query.limit || 30,
        data: [],
      };
    }

    const {
      page = 1,
      limit = 30,
      paymentStatus,
      fulfillmentType,
      q,
      from,
      to,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ordersWhereInput = {};

    if (!isAdmin) {
      where.team_id = { in: teamIds };
    }

    if (q) {
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { full_name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (paymentStatus) {
      where.payment_status = paymentStatus;
    }

    if (fulfillmentType) {
      where.fulfillment_type = fulfillmentType;
    }

    if (from && to) {
      where.created_at = {
        gte: from,
        lte: to,
      };
    } else if (from) {
      where.created_at = {
        gte: from,
      };
    } else if (to) {
      where.created_at = {
        lte: to,
      };
    }

    const [total, orders] = await Promise.all([
      this.prisma.orders.count({ where }),
      this.prisma.orders.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: true,
          payments: true,
          shipment: true,
          team: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      data: orders.map((order) => this.toOrderResponseDto(order)),
    };
  }

  async getOrderForTeams(teamIds: string[], code: string, isAdmin?: boolean) {
    const order = await this.prisma.orders.findUnique({
      where: { code },
      include: {
        items: true,
        payments: true,
        shipment: true,
        team: true,
      },
    });

    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND');
    }

    if (!isAdmin && order.team_id && !teamIds.includes(order.team_id)) {
      throw new ForbiddenException('ORDER_NOT_IN_TEAM');
    }

    return this.toOrderResponseDto(order);
  }

  async deleteOrder(teamIds: string[], code: string, isAdmin?: boolean) {
    const order = await this.prisma.orders.findUnique({
      where: { code },
    });

    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND');
    }

    if (!isAdmin && (!order.team_id || !teamIds.includes(order.team_id))) {
      throw new ForbiddenException('ORDER_NOT_IN_TEAM');
    }

    await this.prisma.orders.delete({
      where: { code },
    });

    return { ok: true, message: 'Order deleted successfully' };
  }
}