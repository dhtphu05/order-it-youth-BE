import {
  ArrayMinSize,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  Validate,
  ValidateNested,
} from 'class-validator';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { fulfillment_type, payment_method } from '@prisma/client';

@ValidatorConstraint({ name: 'variantXorCombo', async: false })
class VariantXorComboConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const obj = args.object as CheckoutItemDto;
    const hasVariant = Boolean(obj.variant_id);
    const hasCombo = Boolean(obj.combo_id);
    return (hasVariant || hasCombo) && !(hasVariant && hasCombo);
  }

  defaultMessage(): string {
    return 'variant_id hoặc combo_id phải được cung cấp (và không đồng thời).';
  }
}

export class CheckoutItemDto {
  @ApiPropertyOptional({
    description: 'ID của biến thể sản phẩm, chỉ truyền nếu item là variant.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  @Validate(VariantXorComboConstraint)
  variant_id?: string;

  @ApiPropertyOptional({
    description: 'ID của combo, chỉ truyền nếu item là combo.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  @Validate(VariantXorComboConstraint)
  combo_id?: string;

  @ApiProperty({ type: 'integer', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Version giá mà FE lưu, dùng để kiểm tra lệch giá.',
    type: 'integer',
    format: 'int64',
    minimum: 1,
    example: 1700000000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  price_version: number;
}

export class CheckoutOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ description: 'Số điện thoại khách hàng.' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9+]{8,15}$/, {
    message: 'Số điện thoại không hợp lệ.',
  })
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    enum: fulfillment_type,
    default: fulfillment_type.PICKUP_SCHOOL,
  })
  @IsOptional()
  @IsEnum(fulfillment_type)
  fulfillment_type?: fulfillment_type;

  @ApiPropertyOptional({
    enum: payment_method,
    default: payment_method.VIETQR,
  })
  @IsOptional()
  @IsEnum(payment_method)
  payment_method?: payment_method;

  @ApiPropertyOptional({ description: 'Mã coupon nếu có.' })
  @IsOptional()
  @IsString()
  coupon_code?: string;

  @ApiProperty({
    description: 'Scope để đảm bảo idempotent (ví dụ checkout:session-abc).',
  })
  @IsString()
  @IsNotEmpty()
  idem_scope: string;

  @ApiProperty({
    description: 'Key duy nhất trong scope, thường là UUID.',
  })
  @IsString()
  @IsNotEmpty()
  idem_key: string;

  @ApiProperty({ type: () => [CheckoutItemDto], minItems: 1 })
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  @ArrayMinSize(1)
  items: CheckoutItemDto[];
}
