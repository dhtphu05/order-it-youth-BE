import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentInitResult, PaymentProvider } from '../interfaces/payment-provider.interface';

@Injectable()
export class VietQrProvider implements PaymentProvider {
    constructor(private readonly configService: ConfigService) { }

    async createPayment(input: {
        donationCode: string;
        amount: number;
        description: string;
    }): Promise<PaymentInitResult> {
        const bankBin = this.configService.get<string>('VIETQR_BANK_CODE');
        const accountNo = this.configService.get<string>('VIETQR_ACCOUNT_NO');
        const accountName = this.configService.get<string>('VIETQR_ACCOUNT_NAME');

        if (!bankBin || !accountNo || !accountName) {
            throw new Error('Missing VietQR configuration (VIETQR_BANK_CODE, VIETQR_ACCOUNT_NO, VIETQR_ACCOUNT_NAME)');
        }

        // Format: https://img.vietqr.io/image/<BANK_BIN>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<CONTENT>&accountName=<NAME>
        const qrText = `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.png?amount=${input.amount}&addInfo=${encodeURIComponent(input.description)}&accountName=${encodeURIComponent(accountName)}`;

        return {
            payment_ref: input.donationCode,
            provider_payload: {
                bankBin,
                accountNo,
                accountName,
                template: 'compact2',
                description: input.description,
            },
            qr_data: qrText,
        };
    }
}
