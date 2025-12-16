import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';

@Injectable()
export class PayOSService {
    private payOS: PayOS;

    constructor(private configService: ConfigService) {
        this.payOS = new PayOS({
            clientId: this.configService.get<string>('PAYOS_CLIENT_ID'),
            apiKey: this.configService.get<string>('PAYOS_API_KEY'),
            checksumKey: this.configService.get<string>('PAYOS_CHECKSUM_KEY'),
        });
    }

    async createPaymentLink(body: any) {
        return await this.payOS.paymentRequests.create(body);
    }

    verifyPaymentWebhookData(webhookBody: any) {
        return this.payOS.webhooks.verify(webhookBody);
    }
}