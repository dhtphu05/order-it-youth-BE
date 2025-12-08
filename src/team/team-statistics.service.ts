import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TeamStatisticsService {
    constructor(private readonly prisma: PrismaService) { }

    private buildDateFilter(from?: Date, to?: Date): Prisma.ordersWhereInput {
        const where: Prisma.ordersWhereInput = {};
        if (from && to) {
            where.created_at = { gte: from, lte: to };
        } else if (from) {
            where.created_at = { gte: from };
        } else if (to) {
            where.created_at = { lte: to };
        }
        return where;
    }

    async getTeamStats(teamIds: string[], from?: Date, to?: Date) {
        if (teamIds.length === 0) {
            return {
                period: { from, to },
                teams: [],
            };
        }

        const dateFilter = this.buildDateFilter(from, to);

        // Get teams that match the context (active or inactive)
        const teams = await this.prisma.teams.findMany({
            where: {
                id: { in: teamIds },
                // is_active: true, // Removed
            },
            select: { id: true, code: true, name: true },
        });

        const stats = await Promise.all(
            teams.map(async (team) => {
                // Revenue for this team
                const revenueAgg = await this.prisma.orders.aggregate({
                    where: {
                        ...dateFilter,
                        team_id: team.id,
                        payment_status: 'SUCCESS',
                    },
                    _sum: {
                        grand_total_vnd: true,
                    },
                });

                // Total orders for this team
                const totalOrders = await this.prisma.orders.count({
                    where: {
                        ...dateFilter,
                        team_id: team.id,
                    },
                });

                // Count by status for this team
                const statusAgg = await this.prisma.orders.groupBy({
                    by: ['order_status'],
                    where: {
                        ...dateFilter,
                        team_id: team.id,
                    },
                    _count: {
                        _all: true,
                    },
                });

                const statusCounts = statusAgg.reduce((acc, curr) => {
                    acc[curr.order_status] = curr._count._all;
                    return acc;
                }, {} as Record<string, number>);

                return {
                    team: {
                        id: team.id,
                        code: team.code,
                        name: team.name,
                    },
                    total_revenue_vnd: Number(revenueAgg._sum.grand_total_vnd || 0),
                    total_orders: totalOrders,
                    orders_by_status: statusCounts,
                };
            }),
        );

        return {
            period: { from, to },
            teams: stats,
        };
    }

    async getTeamShipmentStats(teamIds: string[], from?: Date, to?: Date) {
        if (teamIds.length === 0) {
            return {
                period: { from, to },
                teams: [],
            };
        }

        const dateFilter = this.buildDateFilter(from, to);

        const teams = await this.prisma.teams.findMany({
            where: {
                id: { in: teamIds },
            },
            select: { id: true, code: true, name: true },
        });

        const stats = await Promise.all(
            teams.map(async (team) => {
                const shipmentAgg = await this.prisma.shipments.groupBy({
                    by: ['status'],
                    where: {
                        order: {
                            team_id: team.id,
                            ...dateFilter,
                        },
                    },
                    _count: {
                        _all: true,
                    },
                });

                const totalShipments = shipmentAgg.reduce((acc, curr) => acc + curr._count._all, 0);

                const statusCounts = shipmentAgg.reduce((acc, curr) => {
                    acc[curr.status] = curr._count._all;
                    return acc;
                }, {} as Record<string, number>);

                return {
                    team: {
                        id: team.id,
                        code: team.code,
                        name: team.name,
                    },
                    total_shipments: totalShipments,
                    shipments_by_status: statusCounts,
                };
            }),
        );

        return {
            period: { from, to },
            teams: stats,
        };
    }
}
