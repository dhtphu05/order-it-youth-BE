import {
  fulfillment_type,
  payment_status,
  shipment_status,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class AdminOrderListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(payment_status)
  paymentStatus?: payment_status;

  @IsOptional()
  @IsEnum(fulfillment_type)
  fulfillmentType?: fulfillment_type;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}

class ProviderPayloadDto {
  @IsOptional()
  @IsString()
  referenceNote?: string;
}

export class AdminConfirmPaymentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amountVnd: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  transactionId?: string;

  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paidAt?: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProviderPayloadDto)
  providerPayload?: ProviderPayloadDto;
}

export class AdminCancelOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class AdminDeliverOrderDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deliveredAt?: Date;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(shipment_status)
  shipmentStatus?: shipment_status;
}
