import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { payment_method } from '@prisma/client';
import { CheckoutItemDto } from '../../orders/dto/checkout-order.dto';

export class PosQuickOrderDto {
    @ApiProperty({
        description: 'List of product variants or combos to order.',
        type: [CheckoutItemDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CheckoutItemDto)
    items: CheckoutItemDto[];

    @ApiPropertyOptional({
        description: 'Payment method.',
        enum: payment_method,
        default: payment_method.CASH,
    })
    @IsOptional()
    @IsEnum(payment_method)
    payment_method?: payment_method;

    @ApiPropertyOptional({
        description: 'Explicitly assign to this team (overrides auto-assign).',
        format: 'uuid',
    })
    @IsOptional()
    @IsUUID()
    team_id?: string;

    @ApiPropertyOptional({
        description: 'Referrer code if available.',
    })
    @IsOptional()
    @IsString()
    referrer_code?: string;

    @ApiPropertyOptional({ description: 'Customer Name (auto-filled if missing).' })
    @IsOptional()
    @IsString()
    full_name?: string;

    @ApiPropertyOptional({ description: 'Customer Phone (auto-filled if missing).' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ description: 'Customer Email.' })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({ description: 'Customer Address (auto-filled if missing).' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({
        description: 'ID of the Team Member (Shipper) to assign this order to.',
        format: 'uuid',
    })
    @IsOptional()
    @IsUUID()
    shipper_id?: string;

}
