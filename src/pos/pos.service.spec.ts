
import { Test, TestingModule } from '@nestjs/testing';
import { PosService } from './pos.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { PosQuickOrderDto } from './dto/pos-quick-order.dto';

describe('PosService', () => {
    let service: PosService;
    let prisma: PrismaService;
    let ordersService: OrdersService;

    const mockPrismaService = {
        orders: {
            update: jest.fn(),
            findUnique: jest.fn(),
        },
        teams: {
            findUnique: jest.fn(),
            findMany: jest.fn(), // for getTeams
        },
        users: {
            findUnique: jest.fn(),
        },
        shipments: {
            create: jest.fn(),
        },
        team_members: {
            findMany: jest.fn(),
        }
    };

    const mockOrdersService = {
        checkout: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PosService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: OrdersService, useValue: mockOrdersService },
            ],
        }).compile();

        service = module.get<PosService>(PosService);
        prisma = module.get<PrismaService>(PrismaService);
        ordersService = module.get<OrdersService>(OrdersService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('quickCreate', () => {
        it('should create order via checkout and return it', async () => {
            const dto: PosQuickOrderDto = {
                items: [],
                phone: '0909000111',
            };
            const mockOrderResponse = { code: 'ORD-123', team: null };
            mockOrdersService.checkout.mockResolvedValue(mockOrderResponse);

            const result = await service.quickCreate(dto);

            expect(ordersService.checkout).toHaveBeenCalled();
            expect(result).toEqual(mockOrderResponse);
        });

        it('should update team if provided and different', async () => {
            const dto: PosQuickOrderDto = {
                items: [],
                phone: '0909000111',
                team_id: 'team-uuid-new',
            };
            const mockOrderResponse = { code: 'ORD-123', team: { id: 'team-uuid-old' } };
            mockOrdersService.checkout.mockResolvedValue(mockOrderResponse);

            mockPrismaService.teams.findUnique.mockResolvedValue({
                id: 'team-uuid-new', code: 'TNEW', name: 'Team New'
            });

            await service.quickCreate(dto);

            expect(prisma.orders.update).toHaveBeenCalledWith({
                where: { code: 'ORD-123' },
                data: { team_id: 'team-uuid-new' },
            });
        });

        it('should create shipment if shipper_id is provided', async () => {
            const dto: PosQuickOrderDto = {
                items: [],
                phone: '0909000111',
                shipper_id: 'user-shipper-uuid',
            };
            const mockOrderResponse = { code: 'ORD-123' };
            mockOrdersService.checkout.mockResolvedValue(mockOrderResponse);

            mockPrismaService.orders.findUnique.mockResolvedValue({ id: 'order-uuid' });
            mockPrismaService.users.findUnique.mockResolvedValue({
                id: 'user-shipper-uuid', full_name: 'Shipper', phone: '123'
            });

            await service.quickCreate(dto);

            expect(prisma.shipments.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    order_id: 'order-uuid',
                    assigned_user_id: 'user-shipper-uuid'
                })
            }));
        });
    });
});
