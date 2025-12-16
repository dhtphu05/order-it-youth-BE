import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    returnUrl: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    cancelUrl: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    orderCode: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    buyerName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    buyerEmail?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    buyerPhone?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    buyerAddress?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    items?: any[];
}
