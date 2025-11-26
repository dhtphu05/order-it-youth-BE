import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({
    description: 'Search term for name, description or SKU.',
    example: 'áo đồng phục',
  })
  q?: string;
}

export class AdminCreateVariantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @ApiProperty({
    description: 'Unique SKU within the product.',
    example: 'TSHIRT-BLUE-M',
  })
  sku: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @ApiPropertyOptional({
    description: 'First option such as size.',
    example: 'M',
  })
  option1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @ApiPropertyOptional({
    description: 'Second option such as color.',
    example: 'Blue',
  })
  option2?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({
    description: 'Price in VND.',
    example: 250000,
  })
  priceVnd: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({
    description: 'Available stock quantity.',
    example: 50,
  })
  stock: number;
}

export class AdminUpdateVariantDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  @ApiPropertyOptional({
    description: 'Updated SKU value.',
    example: 'TSHIRT-BLUE-L',
  })
  sku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @ApiPropertyOptional({ description: 'Updated option1', example: 'L' })
  option1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @ApiPropertyOptional({ description: 'Updated option2', example: 'Navy' })
  option2?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ description: 'Updated price', example: 260000 })
  priceVnd?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ description: 'Updated stock', example: 40 })
  stock?: number;
}

export class AdminCreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  @ApiProperty({
    description: 'Product display name.',
    example: 'Áo đồng phục OIY',
  })
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Detailed description of the product.',
    example: 'Áo thun chất liệu cotton mềm mại.',
  })
  description?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Mark true if this product is a donation item.',
    example: false,
  })
  isDonationItem?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminCreateVariantDto)
  @ApiPropertyOptional({
    description: 'Initial variants to create with the product.',
    type: [AdminCreateVariantDto],
  })
  variants?: AdminCreateVariantDto[];

  @ApiPropertyOptional({
    description: 'Main image URL of the product stored after upload.',
    example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    readOnly: true,
  })
  imageUrl?: string;
}

export class AdminUpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  @ApiPropertyOptional({ description: 'Updated product name.' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Updated description.' })
  description?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Updated donation flag.' })
  isDonationItem?: boolean;

  @ApiPropertyOptional({
    description: 'Main image URL of the product stored after upload.',
    example: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    readOnly: true,
  })
  imageUrl?: string;
}
