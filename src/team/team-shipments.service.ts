
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, shipment_status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  TeamAssignOrderDto,
  TeamMarkFailedDto,
  TeamMyShipmentsQueryDto,
  TeamStartDeliveryDto,
  TeamUnassignedShipmentsQueryDto,
} from './dto/team-shipments.dto';
import { TeamContext } from 'src/common/interfaces/team-context.interface';

@Injectable()
export class TeamShipmentsService {
  constructor(private readonly prisma: PrismaService) { }

  private async findOrderAndValidate(
    code: string,
    teamContext: TeamContext,
    userId?: string,
  ) {
    const order = await this.prisma.orders.findUnique({
      where: { code },
      include: { shipment: true },
    });

    if (!order) {
      throw new NotFoundException('ORDER_NOT_FOUND');
    }

    if (!order.team_id || !teamContext.teamIds.includes(order.team_id)) {
      throw new ForbiddenException('ORDER_NOT_IN_TEAM');
    }

    let shipment = order.shipment;
    if (!shipment) {
      shipment = await this.prisma.shipments.create({
        data: {
          order_id: order.id,
          status: shipment_status.PENDING,
        },
      });
    }

    if (userId && shipment.assigned_user_id !== userId) {
      throw new ForbiddenException('NOT_ASSIGNED_TO_YOU');
    }

    return { order, shipment };
  }

  async listUnassignedOrdersForTeams(
    teamIds: string[],
    query: TeamUnassignedShipmentsQueryDto,
  ) {
    const { page = 1, limit = 20, status, q } = query;
    const skip = (page - 1) * limit;

    if (teamIds.length === 0) {
      return { total: 0, page, limit, data: [] };
    }

    const where: Prisma.ordersWhereInput = {
      team_id: { in: teamIds },
      shipment: {
        assigned_user_id: null,
        status: status ?? shipment_status.PENDING,
      },
    };

    if (q) {
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { full_name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.orders.count({ where }),
      this.prisma.orders.findMany({
        where,
        skip,
        take: limit,
        include: { shipment: true },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return { total, page, limit, data: orders };
  }

  async listMyShipments(userId: string, query: TeamMyShipmentsQueryDto) {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.shipmentsWhereInput = {
      assigned_user_id: userId,
    };

    if (status) {
      where.status = status;
    }

    const [total, shipments] = await this.prisma.$transaction([
      this.prisma.shipments.count({ where }),
      this.prisma.shipments.findMany({
        where,
        skip,
        take: limit,
        include: { order: true },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return { total, page, limit, data: shipments };
  }

  async assignSelfToOrder(user: any, teamContext: TeamContext, code: string) {
    const { order, shipment } = await this.findOrderAndValidate(
      code,
      teamContext,
    );

    if (shipment.assigned_user_id && shipment.assigned_user_id !== user.id) {
      throw new ForbiddenException('ALREADY_ASSIGNED');
    }

    const data: Prisma.shipmentsUpdateInput = {
      assigned_user: { connect: { id: user.id } },
      assigned_name: user.full_name,
      assigned_phone: user.phone,
    };

    if (shipment.status === 'PENDING') {
      data.status = 'ASSIGNED';
    }

    await this.prisma.shipments.update({
      where: { id: shipment.id },
      data,
    });

    return { ok: true };
  }

  async unassignSelf(user: any, teamContext: TeamContext, code: string) {
    const { order, shipment } = await this.findOrderAndValidate(
      code,
      teamContext,
    );

    if (shipment.assigned_user_id !== user.id) {
      throw new ForbiddenException('NOT_ASSIGNED_TO_YOU');
    }

    if (
      shipment.status === shipment_status.DELIVERED ||
      shipment.status === shipment_status.FAILED
    ) {
      throw new ForbiddenException('CANNOT_UNASSIGN_COMPLETED_SHIPMENT');
    }

    await this.prisma.shipments.update({
      where: { id: shipment.id },
      data: {
        assigned_user: { disconnect: true },
        assigned_name: null,
        assigned_phone: null,
        status: shipment_status.PENDING,
      },
    });

    return { ok: true };
  }

  async assignOrderToUserAsManager(
    user: any,
    teamContext: TeamContext,
    code: string,
    dto: TeamAssignOrderDto,
  ) {
    const { order, shipment } = await this.findOrderAndValidate(
      code,
      teamContext,
    );

    const role = teamContext.rolesByTeam[order.team_id!];
    if (role !== 'MANAGER') {
      throw new ForbiddenException('NOT_TEAM_MANAGER');
    }

    const membership = await this.prisma.team_members.findFirst({
      where: {
        team_id: order.team_id!,
        user_id: dto.assigneeUserId,
      },
      include: {
        user: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('ASSIGNEE_NOT_IN_TEAM');
    }

    const data: Prisma.shipmentsUpdateInput = {
      assigned_user: { connect: { id: dto.assigneeUserId } },
      assigned_name: membership.user.full_name,
      assigned_phone: membership.user.phone,
    };

    if (dto.pickupEta) {
      data.pickup_eta = dto.pickupEta;
    }

    if (shipment.status === 'PENDING') {
      data.status = 'ASSIGNED';
    }

    await this.prisma.shipments.update({
      where: { id: shipment.id },
      data,
    });

    return { ok: true };
  }

  async startDelivery(
    user: any,
    teamContext: TeamContext,
    code: string,
    dto: TeamStartDeliveryDto,
  ) {
    const { shipment } = await this.findOrderAndValidate(
      code,
      teamContext,
      user.id,
    );

    const data: Prisma.shipmentsUpdateInput = {
      status: 'IN_TRANSIT',
    };

    if (dto.pickupEta) {
      data.pickup_eta = dto.pickupEta;
    }

    await this.prisma.shipments.update({
      where: { id: shipment.id },
      data,
    });

    return { ok: true };
  }

  async markDelivered(user: any, teamContext: TeamContext, code: string) {
    const { order, shipment } = await this.findOrderAndValidate(
      code,
      teamContext,
      user.id,
    );

    await this.prisma.$transaction([
      this.prisma.shipments.update({
        where: { id: shipment.id },
        data: {
          status: 'DELIVERED',
          delivered_at: new Date(),
        },
      }),
      this.prisma.orders.update({
        where: { id: order.id },
        data: {
          order_status: OrderStatus.FULFILLED,
          fulfilled_at: new Date(),
        },
      }),
    ]);

    return { ok: true };
  }

  async markFailed(
    user: any,
    teamContext: TeamContext,
    code: string,
    dto: TeamMarkFailedDto,
  ) {
    const { order, shipment } = await this.findOrderAndValidate(
      code,
      teamContext,
      user.id,
    );

    await this.prisma.$transaction([
      this.prisma.shipments.update({
        where: { id: shipment.id },
        data: {
          status: 'FAILED',
        },
      }),
      this.prisma.orders.update({
        where: { id: order.id },
        data: {
          order_status: OrderStatus.DELIVERY_FAILED,
          delivery_attempts: {
            increment: 1,
          },
          delivery_failed_at: new Date(),
          delivery_failed_reason: dto.reason,
        },
      }),
    ]);

    return { ok: true };
  }
}