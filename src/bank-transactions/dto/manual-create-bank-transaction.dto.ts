import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ManualCreateBankTransactionDto {
  @ApiProperty({ description: 'Mã ngân hàng (VCB, TCB, ...).' })
  @IsString()
  @IsNotEmpty()
  bank_code: string;

  @ApiProperty({ description: 'Số tài khoản nhận tiền.' })
  @IsString()
  @IsNotEmpty()
  account_no: string;

  @ApiProperty({ type: 'integer', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount_vnd: number;

  @ApiProperty({ description: 'Thời điểm giao dịch diễn ra (ISO string).' })
  @IsDateString()
  occurred_at: string;

  @ApiProperty({ description: 'Mã giao dịch ngân hàng (unique).' })
  @IsString()
  @IsNotEmpty()
  transaction_id: string;

  @ApiPropertyOptional({
    description: 'Mô tả giao dịch, ví dụ nội dung chuyển khoản.',
  })
  @IsOptional()
  @IsString()
  narrative?: string;

  @ApiPropertyOptional({
    description: 'Payload gốc để lưu trữ (JSON).',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  raw?: unknown;
}
