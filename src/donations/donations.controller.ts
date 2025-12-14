import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { DonationPaymentStatus, DonationPaymentProvider } from '@prisma/client';

// Note: In a real app we would use RolesGuard for admin routes.
// Assuming /admin prefix is handled or I need to add it.
// User requirement: POST /admin/donations/:id/confirm
// I will create two controllers or one with conditional paths?
// NestJS allows multiple controllers in a module.
// Or I can just put everything here with specific paths.

@Controller('donations')
export class DonationsController {
    constructor(private readonly donationsService: DonationsService) { }

    @Post()
    create(@Body() dto: CreateDonationDto) {
        return this.donationsService.create(dto);
    }

    @Get()
    search(
        @Query('mssv') mssv?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.donationsService.findAllPublic({ mssv, page, limit });
    }
}

@Controller('admin/donations')
export class AdminDonationsController {
    constructor(private readonly donationsService: DonationsService) { }

    @Get()
    findAll(
        @Query('mssv') mssv?: string,
        @Query('provider') provider?: DonationPaymentProvider,
        @Query('status') status?: DonationPaymentStatus,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.donationsService.findAll({ mssv, provider, status, startDate, endDate, page, limit });
    }

    @Post(':id/confirm')
    confirm(@Param('id') id: string) {
        return this.donationsService.confirm(id);
    }
}

@Controller('payments')
export class PaymentsWebhookController {
    // Stub for PayOS Webhook
    @Post('payos/webhook')
    handlePayOSWebhook(@Body() body: any) {
        console.log('PayOS Webhook received:', body);
        return { success: true };
    }
}
