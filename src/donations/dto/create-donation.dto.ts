import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DonationPaymentProvider } from '@prisma/client';

export class CreateDonationDto {
    @IsString()
    @IsNotEmpty()
    student_name: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    student_class?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    mssv?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    phone?: string;

    @IsInt()
    @Min(1000)
    amount: number;

    @IsOptional()
    @IsEnum(DonationPaymentProvider)
    provider?: DonationPaymentProvider = DonationPaymentProvider.VIETQR;
}
