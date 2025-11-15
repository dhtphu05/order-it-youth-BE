import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm thanh toán thủ công' })
  confirm(@Body() dto: ConfirmPaymentDto) {
    return this.paymentsService.confirm(dto);
  }
}
