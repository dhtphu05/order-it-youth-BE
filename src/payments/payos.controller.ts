import {
    Body,
    Controller,
    Post,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PayOSService } from './payos.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@ApiTags('PayOS Payment')
@Controller('payment')
export class PayOSController {
    constructor(
        private readonly payOSService: PayOSService,
        private readonly paymentsService: PaymentsService
    ) { }

    @Post('create')
    @ApiOperation({ summary: 'Create a PayOS payment link' })
    @ApiResponse({ status: 201, description: 'Payment link created successfully' })
    async createPaymentLink(@Body() body: CreatePaymentDto) {
        try {
            return await this.payOSService.createPaymentLink(body);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @Post('webhook')
    async handleWebhook(@Body() body: any) {
        try {
            // Verify webhook data
            const data = await this.payOSService.verifyPaymentWebhookData(body);

            console.log('Webhook valid:', data);

            // Check if payment is successful (PayOS uses code '00' for success)
            if (data.code === '00') {
                try {
                    // Convert PayOS data to ConfirmPaymentDto
                    const confirmDto: ConfirmPaymentDto = {
                        order_code: String(data.orderCode), // PayOS orderCode is number
                        amount_vnd: data.amount,
                        transaction_id: data.reference || String(data.paymentLinkId),
                        paid_at: data.transactionDateTime,
                        reference_note: data.description,
                    };

                    // Call PaymentsService to confirm the order
                    // Pass null as adminUserId since this is a system action
                    await this.paymentsService.confirm(confirmDto, null);

                    console.log(`Payment confirmed for order ${data.orderCode}`);
                } catch (error: any) {
                    // If error is DUPLICATE_TRANSACTION_ID, we can consider it success (already processed)
                    if (error.response?.error_code === 'DUPLICATE_TRANSACTION_ID') {
                        console.log('Payment already confirmed for transaction:', data.reference);
                        return { success: true, data };
                    }

                    console.error('Failed to confirm payment:', error);
                 
                    throw error;
                }
            }

            return {
                success: true,
                data: data,
            };
        } catch (error) {
            console.error('Webhook Error:', error);
            throw new BadRequestException('Invalid webhook data or processing error');
        }
    }
}
