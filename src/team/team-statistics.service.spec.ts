
import { Test, TestingModule } from '@nestjs/testing';
import { TeamStatisticsService } from './team-statistics.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('TeamStatisticsService', () => {
    let service: TeamStatisticsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        teams: {
            findMany: jest.fn(),
        },
        orders: {
            count: jest.fn(),
        },
        $queryRaw: jest.fn(),
        shipments: {
            groupBy: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TeamStatisticsService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<TeamStatisticsService>(TeamStatisticsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getTeamShipmentStats', () => {
        it('should return shipment stats including implicit pending', async () => {
            const teamIds = ['team-1'];
            const mockTeams = [{ id: 'team-1', code: 'T1', name: 'Team One' }];
            // Assume 5 total orders: 1 DELIVERED, 1 FAILED, 3 with no shipment record (Implicit PENDING)
            const mockTotalOrders = 5;
            const mockShipmentStats = [
                { status: 'DELIVERED', _count: { _all: 1 } },
                { status: 'FAILED', _count: { _all: 1 } },
            ];

            mockPrismaService.teams.findMany.mockResolvedValue(mockTeams);
            mockPrismaService.orders.count.mockResolvedValue(mockTotalOrders);
            mockPrismaService.shipments.groupBy.mockResolvedValue(mockShipmentStats);

            const result = await service.getTeamShipmentStats(teamIds);

            expect(result.teams).toHaveLength(1);
            expect(result.teams[0].total_shipments).toBe(5);
            expect(result.teams[0].shipments_by_status).toEqual({
                DELIVERED: 1,
                FAILED: 1,
                PENDING: 3, // 5 - (1+1) = 3
            });

            expect(prisma.orders.count).toHaveBeenCalledWith(
                expect.objectContaining({ where: expect.objectContaining({ team_id: 'team-1' }) })
            );
        });

        it('should handle date filters', async () => {
            const teamIds = ['team-1'];
            const from = new Date('2023-01-01');
            const to = new Date('2023-01-31');
            const mockTeams = [{ id: 'team-1', code: 'T1', name: 'Team One' }];

            mockPrismaService.teams.findMany.mockResolvedValue(mockTeams);
            mockPrismaService.shipments.groupBy.mockResolvedValue([]);

            await service.getTeamShipmentStats(teamIds, from, to);

            expect(prisma.shipments.groupBy).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        order: expect.objectContaining({
                            created_at: { gte: from, lte: to },
                        }),
                    }),
                }),
            );
        });
    });

    describe('getTeamDailyStats', () => {
        it('should return daily stats', async () => {
            const teamIds = ['team-1'];
            const mockRawStats = [
                { date: new Date('2024-01-01'), total_orders: BigInt(5), revenue: BigInt(100000) },
                { date: new Date('2024-01-02'), total_orders: BigInt(3), revenue: BigInt(50000) },
            ];

            (service as any).prisma.$queryRaw.mockResolvedValue(mockRawStats);

            const result = await service.getTeamDailyStats(teamIds);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                date: new Date('2024-01-01'),
                total_orders: 5,
                revenue: 100000,
            });
            expect(prisma.$queryRaw).toHaveBeenCalled();
        });
    });
});
