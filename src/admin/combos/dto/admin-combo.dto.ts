import { combo_pricing_type } from '@prisma/client';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({
    description: 'Search by combo name or slug.',
    example: 'combo ao non',
  })
  q?: string;
}

export class AdminComboComponentDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Variant ID participating in the combo.',
    example: '4b1c9f7c-4cbb-4e4f-9d70-a4b07e79f5a1',
  })
  variantId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'Quantity of the variant in the combo.',
    example: 2,
  })
  quantity: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({
    description: 'Override unit price for this variant when part of the combo.',
    example: 120000,
  })
  unitPriceOverrideVnd?: number;
}

export class AdminCreateComboDto {
  @IsString()
  @MaxLength(160)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Display name of the combo.',
    example: 'Combo áo + nón',
  })
  name: string;

  @IsString()
  @MaxLength(160)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Unique slug for the combo.',
    example: 'combo-ao-non',
  })
  slug: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Combo description shown to customers.',
    example: 'Tiết kiệm hơn khi mua áo và nón cùng lúc.',
  })
  description?: string;

  @IsEnum(combo_pricing_type)
  @ApiProperty({
    description: 'Pricing strategy for the combo.',
    enum: combo_pricing_type,
    example: combo_pricing_type.SUM_MINUS_AMOUNT,
  })
  pricingType: combo_pricing_type;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({
    description: 'List price used for FIXED_PRICE combos.',
    example: 280000,
  })
  listPriceVnd: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({
    description: 'Amount discount for SUM_MINUS_AMOUNT combos.',
    example: 20000,
  })
  amountOffVnd?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({
    description: 'Percent discount for SUM_MINUS_PERCENT combos.',
    example: 10,
  })
  percentOff?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Whether the combo is active for purchase.',
    example: true,
  })
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Optional cover image URL.',
    example: 'https://cdn.example.com/combos/combo-ao-non.jpg',
  })
  coverImage?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AdminComboComponentDto)
  @ApiProperty({
    description: 'Components that make up the combo.',
    type: [AdminComboComponentDto],
  })
  components: AdminComboComponentDto[];
}

export class AdminUpdateComboDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  @ApiPropertyOptional({ description: 'Updated combo name.' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @ApiPropertyOptional({ description: 'Updated slug.' })
  slug?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Updated description.' })
  description?: string;

  @IsOptional()
  @IsEnum(combo_pricing_type)
  @ApiPropertyOptional({
    description: 'Updated pricing type.',
    enum: combo_pricing_type,
  })
  pricingType?: combo_pricing_type;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ description: 'Updated list price.', example: 250000 })
  listPriceVnd?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({
    description: 'Updated amount discount.',
    example: 15000,
  })
  amountOffVnd?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({
    description: 'Updated percent discount.',
    example: 15,
  })
  percentOff?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Updated active flag.' })
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Updated cover image URL.' })
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminComboComponentDto)
  @ApiPropertyOptional({
    description: 'Replacing combo components.',
    type: [AdminComboComponentDto],
  })
  components?: AdminComboComponentDto[];
}
