import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminStatisticsService {
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

    async getOverallStats(from?: Date, to?: Date) {
        const dateFilter = this.buildDateFilter(from, to);

        // 1. Total Revenue (Payment Status = SUCCESS)
        const revenueAgg = await this.prisma.orders.aggregate({
            where: {
                ...dateFilter,
                payment_status: 'SUCCESS',
            },
            _sum: {
                grand_total_vnd: true,
            },
        });

        // 2. Order Counts by Status
        const statusAgg = await this.prisma.orders.groupBy({
            by: ['order_status'],
            where: dateFilter,
            _count: {
                _all: true,
            },
        });

        // 3. Total Orders
        const totalOrders = await this.prisma.orders.count({
            where: dateFilter,
        });

        const statusCounts = statusAgg.reduce((acc, curr) => {
            acc[curr.order_status] = curr._count._all;
            return acc;
        }, {} as Record<string, number>);

        return {
            period: { from, to },
            total_revenue_vnd: Number(revenueAgg._sum.grand_total_vnd || 0),
            total_orders: totalOrders,
            orders_by_status: statusCounts,
        };
    }

    async getTeamStats(from?: Date, to?: Date) {
        const dateFilter = this.buildDateFilter(from, to);

        // Get all teams (active or inactive) to show full history
        const teams = await this.prisma.teams.findMany({
            // where: { is_active: true }, // Removed to show historical stats
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

    async getDailyStats(from?: Date, to?: Date) {
        // Build SQL conditions manually or parameters for raw query
        // Since we need to group by date(created_at), we use queryRaw

        let dateCondition = Prisma.sql`1=1`;

        if (from && to) {
            dateCondition = Prisma.sql`created_at >= ${from} AND created_at <= ${to}`;
        } else if (from) {
            dateCondition = Prisma.sql`created_at >= ${from}`;
        } else if (to) {
            dateCondition = Prisma.sql`created_at <= ${to}`;
        }

        const rawStats = await this.prisma.$queryRaw<any[]>`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_orders,
                SUM(CASE WHEN payment_status = 'SUCCESS' THEN grand_total_vnd ELSE 0 END) as revenue
            FROM orders
            WHERE ${dateCondition}
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) DESC
        `;

        // Map deserialized BigInt/dates if necessary, though prisma returns standard objects usually.
        // It's safer to map number fields to prevent BigInt serialization issues in JSON.

        return rawStats.map((stat) => ({
            date: stat.date, // likely a Date object or string depending on driver
            total_orders: Number(stat.total_orders),
            revenue: Number(stat.revenue || 0),
        }));
    }
}
