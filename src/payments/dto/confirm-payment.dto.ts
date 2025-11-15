import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ConfirmPaymentDto {
  @ApiProperty({ description: 'Order code cần confirm thanh toán.' })
  @IsString()
  @IsNotEmpty()
  order_code: string;

  @ApiProperty({ type: 'integer', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount_vnd: number;

  @ApiPropertyOptional({
    description: 'Mã giao dịch ngân hàng (unique, nếu có).',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  transaction_id?: string;

  @ApiPropertyOptional({
    description: 'Tham chiếu nội bộ, mặc định = order_code.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  reference_code?: string;

  @ApiPropertyOptional({ description: 'Force confirm dù lệch số tiền.' })
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @ApiPropertyOptional({
    description: 'Lý do nếu force hoặc ghi chú thêm.',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
