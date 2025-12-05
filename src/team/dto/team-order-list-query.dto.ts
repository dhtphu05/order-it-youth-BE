import { fulfillment_type, payment_status } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TeamOrderListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({
    description: 'Page number for pagination.',
    default: 1,
    minimum: 1,
  })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({
    description: 'Number of items per page.',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  limit?: number = 20;

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
    description: 'Search by order code, customer name, or phone.',
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
