
import { Test, TestingModule } from '@nestjs/testing';
import { AdminStatisticsService } from './admin-statistics.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('AdminStatisticsService', () => {
    let service: AdminStatisticsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        orders: {
            aggregate: jest.fn(),
            groupBy: jest.fn(),
            count: jest.fn(),
        },
        teams: {
            findMany: jest.fn(),
        },
        $queryRaw: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminStatisticsService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<AdminStatisticsService>(AdminStatisticsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getDailyStats', () => {
        it('should return daily stats including revenue and orders', async () => {
            const mockRawStats = [
                {
                    date: '2023-11-20',
                    total_orders: 5n, // BigInt from DB driver usually
                    revenue: 150000n,
                },
                {
                    date: '2023-11-21',
                    total_orders: 2n,
                    revenue: 0n,
                },
            ];

            mockPrismaService.$queryRaw.mockResolvedValue(mockRawStats);

            const result = await service.getDailyStats();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                date: '2023-11-20',
                total_orders: 5,
                revenue: 150000,
            });
            expect(result[1]).toEqual({
                date: '2023-11-21',
                total_orders: 2,
                revenue: 0,
            });
            expect(prisma.$queryRaw).toHaveBeenCalled();
        });

        it('should handle dates filters correctly', async () => {
            const from = new Date('2023-11-01');
            const to = new Date('2023-11-30');

            mockPrismaService.$queryRaw.mockResolvedValue([]);

            await service.getDailyStats(from, to);

            expect(prisma.$queryRaw).toHaveBeenCalled();
        });
    });
});
