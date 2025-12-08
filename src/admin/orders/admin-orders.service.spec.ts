
import { Test, TestingModule } from '@nestjs/testing';
import { AdminOrdersService } from './admin-orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../../orders/orders.service';
import { NotFoundException } from '@nestjs/common';

describe('AdminOrdersService', () => {
    let service: AdminOrdersService;
    let prisma: PrismaService;

    const mockPrismaService = {
        orders: {
            findUnique: jest.fn(),
            delete: jest.fn(),
        },
    };

    const mockOrdersService = {};

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminOrdersService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: OrdersService, useValue: mockOrdersService },
            ],
        }).compile();

        service = module.get<AdminOrdersService>(AdminOrdersService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('deleteOrder', () => {
        it('should delete an order if it exists', async () => {
            const orderId = 'order-uuid';
            mockPrismaService.orders.findUnique.mockResolvedValue({ id: orderId });
            mockPrismaService.orders.delete.mockResolvedValue({ id: orderId });

            const result = await service.deleteOrder(orderId);

            expect(result).toEqual({ message: 'Order deleted successfully', id: orderId });
            expect(prisma.orders.delete).toHaveBeenCalledWith({ where: { id: orderId } });
        });

        it('should throw NotFoundException if order does not exist', async () => {
            const orderId = 'non-existent-uuid';
            mockPrismaService.orders.findUnique.mockResolvedValue(null);

            await expect(service.deleteOrder(orderId)).rejects.toThrow(NotFoundException);
        });
    });
});
