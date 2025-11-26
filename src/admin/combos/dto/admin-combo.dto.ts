import { combo_pricing_type } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBoolean,
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

export class AdminComboListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;
}

export class AdminComboComponentDto {
  @IsUUID()
  variantId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  unitPriceOverrideVnd?: number;
}

export class AdminCreateComboDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(combo_pricing_type)
  pricingType: combo_pricing_type;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  listPriceVnd: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountOffVnd?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  percentOff?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ValidateNested({ each: true })
  @Type(() => AdminComboComponentDto)
  @ArrayMinSize(1)
  components: AdminComboComponentDto[];
}

export class AdminUpdateComboDto extends PartialType(AdminCreateComboDto) {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AdminComboComponentDto)
  components?: AdminComboComponentDto[];
}
