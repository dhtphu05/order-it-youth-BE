import { fulfillment_type, payment_status } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminOrderListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(payment_status)
  @ApiPropertyOptional({
    description: 'Filter by payment status.',
    enum: payment_status,
  })
  paymentStatus?: payment_status;

  @IsOptional()
  @IsEnum(fulfillment_type)
  @ApiPropertyOptional({
    description: 'Filter by fulfillment type.',
    enum: fulfillment_type,
  })
  fulfillmentType?: fulfillment_type;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Search by order code, customer name, phone or email.',
    example: 'OIY-2026-00045',
  })
  q?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({
    description: 'Start date filter (ISO string).',
    example: '2026-01-01T00:00:00Z',
  })
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({
    description: 'End date filter (ISO string).',
    example: '2026-01-31T23:59:59Z',
  })
  to?: Date;
}

class ProviderPayloadDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Reference note or memo captured from the bank statement.',
    example: 'OIY-2026-00012 Nguyen Van A',
  })
  referenceNote?: string;
}

export class AdminConfirmPaymentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'Amount received in VND.',
    example: 450000,
  })
  amountVnd: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @ApiPropertyOptional({
    description: 'Unique transaction reference code.',
    example: 'VCB240101123456',
  })
  transactionId?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Force confirm even when amount mismatch.',
    example: false,
  })
  force?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @ApiPropertyOptional({
    description: 'Timestamp when payment was made.',
    example: '2026-01-15T09:30:00+07:00',
  })
  paidAt?: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProviderPayloadDto)
  @ApiPropertyOptional({
    description: 'Provider payload metadata, e.g. reference note.',
    type: ProviderPayloadDto,
  })
  providerPayload?: ProviderPayloadDto;
}
