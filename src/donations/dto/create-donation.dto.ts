import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DonationPaymentProvider } from '@prisma/client';

export class CreateDonationDto {
    @IsString()
    @IsNotEmpty()
    student_name: string;

    @IsString()
    @IsNotEmpty()
    student_class: string;

    @IsString()
    @IsNotEmpty()
    mssv: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsInt()
    @Min(1000)
    amount: number;

    @IsOptional()
    @IsEnum(DonationPaymentProvider)
    provider?: DonationPaymentProvider = DonationPaymentProvider.VIETQR;
}
