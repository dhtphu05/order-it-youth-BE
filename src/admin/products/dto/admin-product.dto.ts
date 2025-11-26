import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class AdminProductListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;
}

export class AdminCreateVariantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  sku: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  option1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  option2?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceVnd: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;
}

export class AdminUpdateVariantDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  sku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  option1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  option2?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceVnd?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;
}

export class AdminCreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isDonationItem?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminCreateVariantDto)
  variants?: AdminCreateVariantDto[];
}

export class AdminUpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isDonationItem?: boolean;
}
