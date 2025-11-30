import { ApiProperty } from '@nestjs/swagger';
import { payment_status } from '@prisma/client';

export class PaymentRecordDto {
  @ApiProperty({
    example: true,
    description: 'Indicates the confirmation succeeded.',
  })
  ok: boolean;

  @ApiProperty({
    example: 'OIY-2026-00001',
    description: 'Code of the order whose payment was confirmed.',
  })
  order_code: string;

  @ApiProperty({
    example: payment_status.SUCCESS,
    description: 'Payment status after confirmation.',
    enum: payment_status,
  })
  payment_status: payment_status;
}
