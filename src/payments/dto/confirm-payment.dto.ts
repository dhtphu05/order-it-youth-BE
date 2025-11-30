import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ConfirmPaymentDto {
  @ApiProperty({
    example: 'OIY-2026-00001',
    description: 'Order code cần confirm thanh toán.',
  })
  @IsString()
  @IsNotEmpty()
  order_code: string;

  @ApiProperty({
    example: 452500,
    description: 'Số tiền đã nhận thực tế (VND).',
    type: 'integer',
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount_vnd: number;

  @ApiProperty({
    example: 'VCB-2026-001234',
    description: 'Transaction ID duy nhất từ sao kê ngân hàng.',
  })
  @IsString()
  @IsNotEmpty()
  transaction_id: string;

  @ApiPropertyOptional({
    example: 'OIY-2026-00001',
    description: 'Tham chiếu nội bộ, mặc định = order_code.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  reference_code?: string;

  @ApiPropertyOptional({
    example: 'OIY-2026-00001; Nguyen Van A',
    description: 'Ghi chú/raw reference note từ sao kê.',
  })
  @IsOptional()
  @IsString()
  reference_note?: string;

  @ApiPropertyOptional({
    example: '2026-01-15T09:21:00+07:00',
    description:
      'Thời điểm thanh toán dạng ISO 8601. Mặc định là thời điểm gọi API.',
  })
  @IsOptional()
  @IsISO8601()
  paid_at?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Đặt true để cho phép force dù lệch số tiền.',
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @ApiPropertyOptional({
    example: 'Học sinh tự nộp thiếu 10,000 VND nên chấp nhận.',
    description: 'Lý do đi kèm khi phải force confirm.',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
