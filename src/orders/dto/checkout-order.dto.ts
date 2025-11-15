import {
  ArrayMinSize,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  Validate,
  ValidateNested,
  IsInt,
} from 'class-validator';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';
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
  @IsOptional()
  @IsUUID()
  @Validate(VariantXorComboConstraint)
  variant_id?: string;

  @IsOptional()
  @IsUUID()
  combo_id?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  price_version: number;
}

export class CheckoutOrderDto {
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9+]{8,15}$/, {
    message: 'Số điện thoại không hợp lệ.',
  })
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(fulfillment_type)
  fulfillment_type?: fulfillment_type;

  @IsOptional()
  @IsEnum(payment_method)
  payment_method?: payment_method;

  @IsOptional()
  @IsString()
  coupon_code?: string;

  @IsString()
  @IsNotEmpty()
  idem_scope: string;

  @IsString()
  @IsNotEmpty()
  idem_key: string;

  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  @ArrayMinSize(1)
  items: CheckoutItemDto[];
}
