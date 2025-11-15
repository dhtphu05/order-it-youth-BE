import { ApiProperty } from '@nestjs/swagger';

export class ProductVariantDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  sku: string;

  @ApiProperty({ nullable: true, required: false })
  option1: string | null;

  @ApiProperty({ nullable: true, required: false })
  option2: string | null;

  @ApiProperty({ type: 'integer' })
  price_vnd: number;

  @ApiProperty({ type: 'integer', format: 'int64' })
  price_version: number;

  @ApiProperty({ type: 'integer' })
  stock: number;
}

export class ProductResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true, required: false })
  description: string | null;

  @ApiProperty()
  is_donation_item: boolean;

  @ApiProperty({ type: () => [ProductVariantDto] })
  variants: ProductVariantDto[];
}

export class ComboComponentVariantDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  sku: string;

  @ApiProperty({ nullable: true, required: false })
  option1: string | null;

  @ApiProperty({ nullable: true, required: false })
  option2: string | null;

  @ApiProperty({ type: 'integer' })
  price_vnd: number;

  @ApiProperty({ type: 'integer', format: 'int64' })
  price_version: number;
}

export class ComboComponentDto {
  @ApiProperty({ type: () => ComboComponentVariantDto })
  variant: ComboComponentVariantDto;

  @ApiProperty({ type: 'integer' })
  quantity: number;
}

export class ComboResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ enum: ['FIXED_PRICE', 'SUM_COMPONENTS', 'SUM_MINUS_AMOUNT', 'SUM_MINUS_PERCENT'] })
  pricing_type: string;

  @ApiProperty({ type: 'integer' })
  list_price_vnd: number;

  @ApiProperty({ type: 'integer' })
  amount_off_vnd: number;

  @ApiProperty({ type: 'integer' })
  percent_off: number;

  @ApiProperty({ type: 'integer', format: 'int64' })
  price_version: number;

  @ApiProperty({ type: () => [ComboComponentDto] })
  components: ComboComponentDto[];
}
