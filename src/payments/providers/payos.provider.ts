import { Injectable, NotImplementedException } from '@nestjs/common';
import { PaymentInitResult, PaymentProvider } from '../interfaces/payment-provider.interface';

@Injectable()
export class PayOSProvider implements PaymentProvider {
    async createPayment(input: {
        donationCode: string;
        amount: number;
        description: string;
    }): Promise<PaymentInitResult> {
        throw new NotImplementedException('PayOS integration is not yet implemented.');
    }
}
