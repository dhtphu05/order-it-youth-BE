import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProviderFactory } from '../payments/payment-provider.factory';
import { CreateDonationDto } from './dto/create-donation.dto';
import { DonationPaymentStatus, DonationPaymentProvider } from '@prisma/client';
import { calculatePvcdPoints } from './donations.domain';

@Injectable()
export class DonationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paymentFactory: PaymentProviderFactory,
    ) { }

    async create(dto: CreateDonationDto) {
        try {
            const providerEnum = dto.provider ?? DonationPaymentProvider.VIETQR;

            // Generate donation code (unique)
            // Format: {3_random_digits}-{phone}
            const randomPrefix = Math.floor(100 + Math.random() * 900); // 100-999
            const donationCode = `${randomPrefix}-${dto.phone}`;

            // Create PENDING donation
            const donation = await this.prisma.donations.create({
                data: {
                    donation_code: donationCode,
                    student_name: dto.student_name,
                    student_class: dto.student_class,
                    mssv: dto.mssv,
                    phone: dto.phone,
                    amount: dto.amount,
                    payment_provider: providerEnum,
                    payment_status: DonationPaymentStatus.PENDING,
                },
            });

            // Call Provider
            const provider = this.paymentFactory.getProvider(providerEnum);
            const paymentResult = await provider.createPayment({
                donationCode: donation.donation_code,
                amount: donation.amount,
                description: `Donation ${donation.donation_code}`,
                buyerName: donation.student_name,
                buyerPhone: donation.phone,
            });

            // Update donation with payment ref if available
            if (paymentResult.payment_ref || paymentResult.provider_payload) {
                await this.prisma.donations.update({
                    where: { id: donation.id },
                    data: {
                        payment_ref: paymentResult.payment_ref,
                        payment_payload: paymentResult.provider_payload ?? undefined,
                    },
                });
            }

            return {
                donation_id: donation.id,
                donation_code: donation.donation_code,
                payment_provider: donation.payment_provider,
                vietqr_data: paymentResult.qr_data, // Only if VIETQR
                checkout_url: paymentResult.checkout_url, // Future use
            };
        } catch (error) {
            console.error(error);
            throw new BadRequestException(error.message);
        }
    }

    async confirm(id: string) {
        const donation = await this.prisma.donations.findUnique({
            where: { id },
        });

        if (!donation) {
            throw new NotFoundException('Donation not found');
        }

        if (donation.payment_status === DonationPaymentStatus.CONFIRMED) {
            return donation; // Idempotent
        }

        const points = calculatePvcdPoints(donation.amount);

        return this.prisma.donations.update({
            where: { id },
            data: {
                payment_status: DonationPaymentStatus.CONFIRMED,
                confirmed_at: new Date(),
                pvcd_points: points,
            },
        });
    }

    async findAll(query: { mssv?: string; provider?: DonationPaymentProvider; status?: DonationPaymentStatus; startDate?: string; endDate?: string; page?: number; limit?: number }) {
        const { mssv, provider, status, startDate, endDate, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (mssv) where.mssv = { contains: mssv, mode: 'insensitive' };
        if (provider) where.payment_provider = provider;
        if (status) where.payment_status = status;

        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) where.created_at.gte = new Date(startDate);
            if (endDate) where.created_at.lte = new Date(endDate);
        }

        const [data, total] = await Promise.all([
            this.prisma.donations.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.donations.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }
}
