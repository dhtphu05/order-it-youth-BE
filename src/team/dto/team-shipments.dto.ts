
import { shipment_status } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class TeamUnassignedShipmentsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => (value ? Number(value) : 1))
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => (value ? Number(value) : 20))
  limit?: number;

  @IsOptional()
  @IsEnum(shipment_status)
  status?: shipment_status;

  @IsOptional()
  @IsString()
  q?: string;
}

export class TeamMyShipmentsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => (value ? Number(value) : 1))
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => (value ? Number(value) : 20))
  limit?: number;

  @IsOptional()
  @IsEnum(shipment_status)
  status?: shipment_status;
}

export class TeamAssignOrderDto {
  @IsUUID()
  assigneeUserId: string;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  pickupEta?: Date;
}
