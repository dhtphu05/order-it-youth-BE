import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    OrderStatus,
    Prisma,
    fulfillment_type,
    payment_status,
    shipment_status,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { CheckoutOrderDto } from '../orders/dto/checkout-order.dto';
import { PosQuickOrderDto } from './dto/pos-quick-order.dto';

@Injectable()
export class PosService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly ordersService: OrdersService,
    ) { }

    async quickCreate(dto: PosQuickOrderDto) {
        // 1. Prepare minimal checkout payload
        const checkoutDto = new CheckoutOrderDto();

        // Auto-fill minimal info or use provided
        checkoutDto.full_name = dto.full_name ?? 'Khách vãng lai';
        checkoutDto.phone = dto.phone ?? '0000000000';
        checkoutDto.email = dto.email;
        checkoutDto.address = dto.address ?? 'Mua tại quầy';
        checkoutDto.note = 'Quick Order (POS)';
        checkoutDto.fulfillment_type = fulfillment_type.PICKUP_SCHOOL;
        checkoutDto.payment_method = dto.payment_method ?? 'CASH';
        checkoutDto.team_ref_code = dto.referrer_code;

        // Items
        checkoutDto.items = dto.items;

        // Idempotency
        const now = Date.now();
        checkoutDto.idem_scope = 'public-pos';
        checkoutDto.idem_key = `pos-${now}-${Math.random()}`;

        // 2. Call Standard Checkout
        let orderResponse = await this.ordersService.checkout(checkoutDto);

        // 3. Post-processing

        // A. Team Override
        if (dto.team_id) {
            if (orderResponse.team?.id !== dto.team_id) {
                await this.prisma.orders.update({
                    where: { code: orderResponse.code },
                    data: { team_id: dto.team_id }
                });

                const team = await this.prisma.teams.findUnique({ where: { id: dto.team_id } });
                if (team) {
                    orderResponse.team = { id: team.id, code: team.code, name: team.name };
                }
            }
        }

        // B. Shipper Assignment (if provided)
        if (dto.shipper_id) {
            // Retrieve Order ID (response might not have it or depends on DTO)
            const orderDB = await this.prisma.orders.findUnique({ where: { code: orderResponse.code } });
            if (orderDB) {
                // Check if user exists
                const user = await this.prisma.users.findUnique({ where: { id: dto.shipper_id } });
                if (user) {
                    // Create Shipment
                    await this.prisma.shipments.create({
                        data: {
                            order_id: orderDB.id,
                            status: shipment_status.ASSIGNED,
                            assigned_user_id: user.id,
                            assigned_name: user.full_name,
                            assigned_phone: user.phone
                        }
                    });
                }
            }
        }

        return orderResponse;
        return orderResponse;
    }

    async getTeams() {
        // Return only necessary info for public selection
        const teams = await this.prisma.teams.findMany({
            where: { is_active: true },
            select: {
                id: true,
                code: true,
                name: true,
            }
        });
        return teams;
    }

    async getTeamMembers(teamId: string) {
        // Return members (shippers) for the selected team
        const members = await this.prisma.team_members.findMany({
            where: {
                team_id: teamId,
                user: {
                    // Only active users? Schema doesn't have is_active on users, but maybe we assume they are valid.
                    // Ideally filter by role if needed, but for now returned all members as potential shippers.
                }
            },
            select: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        phone: true
                    }
                },
                role: true
            }
        });

        // Flatten structure for FE convenience
        return members.map(m => ({
            id: m.user.id,
            full_name: m.user.full_name,
            phone: m.user.phone,
            role: m.role
        }));
    }
}
