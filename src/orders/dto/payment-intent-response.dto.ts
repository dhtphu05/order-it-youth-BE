import { ApiProperty } from '@nestjs/swagger';
import { payment_status } from '@prisma/client';

export class PaymentIntentBankDto {
  @ApiProperty({ description: 'Mã ngân hàng nhận chuyển khoản' })
  bank_code: string;

  @ApiProperty({ description: 'Số tài khoản nhận chuyển khoản' })
  account_no: string;

  @ApiProperty({ description: 'Chủ tài khoản nhận chuyển khoản' })
  account_name: string;
}

export class PaymentIntentResponseDto {
  @ApiProperty()
  order_code: string;

  @ApiProperty({ enum: payment_status })
  payment_status: payment_status;

  @ApiProperty({ type: 'integer' })
  amount_vnd: number;

  @ApiProperty()
  transfer_content: string;

  @ApiProperty({ type: () => PaymentIntentBankDto })
  bank: PaymentIntentBankDto;
}
