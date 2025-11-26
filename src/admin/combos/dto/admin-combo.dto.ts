import { combo_pricing_type } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
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
  @IsString()
  @IsNotEmpty()
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
  @MaxLength(160)
  @IsNotEmpty()
  name: string;

  @IsString()
  @MaxLength(160)
  @IsNotEmpty()
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

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AdminComboComponentDto)
  components: AdminComboComponentDto[];
}

export class AdminUpdateComboDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(combo_pricing_type)
  pricingType?: combo_pricing_type;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  listPriceVnd?: number;

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

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminComboComponentDto)
  components?: AdminComboComponentDto[];
}
