import { Module } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { DonationsController, AdminDonationsController, PaymentsWebhookController } from './donations.controller';
import { PaymentsModule } from '../payments/payments.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PaymentsModule, PrismaModule],
    controllers: [DonationsController, AdminDonationsController, PaymentsWebhookController],
    providers: [DonationsService],
})
export class DonationsModule { }
