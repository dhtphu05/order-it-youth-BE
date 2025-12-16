import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentProviderFactory } from './payment-provider.factory';
import { VietQrProvider } from './providers/vietqr.provider';
import { PayOSProvider } from './providers/payos.provider';
import { PayOSService } from './payos.service';
import { PayOSController } from './payos.controller';

@Module({
  controllers: [PaymentsController, PayOSController],
  providers: [PaymentsService, PaymentProviderFactory, VietQrProvider, PayOSProvider, PayOSService],
  exports: [PaymentsService, PaymentProviderFactory, PayOSService],
})
export class PaymentsModule { }

