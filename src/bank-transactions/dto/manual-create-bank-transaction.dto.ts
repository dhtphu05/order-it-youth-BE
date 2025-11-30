import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ManualCreateBankTransactionDto {
  @ApiProperty({
    example: 452_500,
    description: 'Số tiền giao dịch (VND).',
    type: 'integer',
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amount_vnd: number;

  @ApiProperty({
    example: '2026-01-15T09:21:00+07:00',
    description:
      'Thời điểm giao dịch theo ISO 8601. FE sẽ convert “15:32 30/11/2025” sang ISO string trước khi gửi.',
  })
  @IsString()
  @IsNotEmpty()
  occurred_at: string;

  @ApiProperty({
    example: 'VCB-2026-001234',
    description: 'Transaction ID duy nhất từ sao kê.',
  })
  @IsString()
  @IsNotEmpty()
  transaction_id: string;

  @ApiProperty({
    example: 'OIY-2026-00001; Nguyen A; donation',
    description: 'Mô tả/narrative trong sao kê.',
  })
  @IsString()
  @IsNotEmpty()
  narrative: string;

  @ApiPropertyOptional({
    example: 'OIY-2026-00001',
    description: 'Order code nếu admin đã xác định trước.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  matched_order_code?: string;

  @ApiPropertyOptional({
    description: 'Payload thô (JSON) từ import hoặc webhook.',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  raw?: unknown;
}
