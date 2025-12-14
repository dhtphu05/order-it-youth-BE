import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentProviderFactory } from './payment-provider.factory';
import { VietQrProvider } from './providers/vietqr.provider';
import { PayOSProvider } from './providers/payos.provider';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentProviderFactory, VietQrProvider, PayOSProvider],
  exports: [PaymentsService, PaymentProviderFactory],
})
export class PaymentsModule { }
