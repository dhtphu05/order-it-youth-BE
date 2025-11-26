import { ApiProperty } from '@nestjs/swagger';
import { payment_status } from '@prisma/client';

export class PaymentIntentBankDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  account_number: string;

  @ApiProperty()
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
