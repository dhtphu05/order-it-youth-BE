
import { Test, TestingModule } from '@nestjs/testing';
import { TeamShipmentsService } from './team-shipments.service';
import { PrismaService } from '../prisma/prisma.service';
import { helper } from '../common/helper';

describe('TeamShipmentsService', () => {
    let service: TeamShipmentsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        orders: {
            findUnique: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn(),
        },
        shipments: {
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn(),
        },
        $transaction: jest.fn((promises) => Promise.all(promises)),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TeamShipmentsService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<TeamShipmentsService>(TeamShipmentsService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('listUnassignedOrdersForTeams', () => {
        it('should query for orders with null shipment OR pending unassigned shipment', async () => {
            const teamIds = ['team-1'];
            const query = { page: 1, limit: 10 };

            mockPrismaService.orders.count.mockResolvedValue(0);
            mockPrismaService.orders.findMany.mockResolvedValue([]);

            await service.listUnassignedOrdersForTeams(teamIds, query);

            const expectedWhere = expect.objectContaining({
                team_id: { in: teamIds },
                OR: [
                    { shipment: { is: null } },
                    { shipment: { assigned_user_id: null, status: 'PENDING' } },
                ],
            });

            expect(prisma.orders.count).toHaveBeenCalledWith({ where: expectedWhere });
            expect(prisma.orders.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: expectedWhere })
            );
        });
    });
});
