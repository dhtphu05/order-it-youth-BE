import { ApiProperty } from '@nestjs/swagger';

export class PaymentIntentResponseDto {
  @ApiProperty()
  order_code: string;

  @ApiProperty({ type: 'integer' })
  amount_vnd: number;

  @ApiProperty()
  bank_code: string;

  @ApiProperty()
  account_no: string;

  @ApiProperty()
  account_name: string;

  @ApiProperty()
  transfer_content: string;
}
