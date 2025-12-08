
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
        it('should return shipment stats for teams', async () => {
            const teamIds = ['team-1'];
            const mockTeams = [{ id: 'team-1', code: 'T1', name: 'Team One' }];
            const mockShipmentStats = [
                { status: 'PENDING', _count: { _all: 5 } },
                { status: 'DELIVERED', _count: { _all: 3 } },
            ];

            mockPrismaService.teams.findMany.mockResolvedValue(mockTeams);
            mockPrismaService.shipments.groupBy.mockResolvedValue(mockShipmentStats);

            const result = await service.getTeamShipmentStats(teamIds);

            expect(result.teams).toHaveLength(1);
            expect(result.teams[0].total_shipments).toBe(8);
            expect(result.teams[0].shipments_by_status).toEqual({
                PENDING: 5,
                DELIVERED: 3,
            });
            expect(prisma.shipments.groupBy).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        order: expect.objectContaining({
                            team_id: 'team-1',
                        }),
                    }),
                }),
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
});
