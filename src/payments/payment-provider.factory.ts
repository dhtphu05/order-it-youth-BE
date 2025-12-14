import { Injectable, BadRequestException } from '@nestjs/common';
import { DonationPaymentProvider } from '@prisma/client';
import { VietQrProvider } from './providers/vietqr.provider';
import { PayOSProvider } from './providers/payos.provider';
import { PaymentProvider } from './interfaces/payment-provider.interface';

@Injectable()
export class PaymentProviderFactory {
    constructor(
        private readonly vietQr: VietQrProvider,
        private readonly payOS: PayOSProvider,
    ) { }

    getProvider(provider: DonationPaymentProvider): PaymentProvider {
        switch (provider) {
            case DonationPaymentProvider.VIETQR:
                return this.vietQr;
            case DonationPaymentProvider.PAYOS:
                return this.payOS;
            default:
                throw new BadRequestException(`Unsupported payment provider: ${provider}`);
        }
    }
}
