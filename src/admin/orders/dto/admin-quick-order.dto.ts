import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { payment_method } from '@prisma/client';
import { CheckoutItemDto } from '../../../orders/dto/checkout-order.dto';

export class AdminQuickOrderDto {
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

    @ApiPropertyOptional({
        description: 'If true, mark order as PAID and payment as SUCCESS immediately.',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    mark_paid?: boolean;
}
