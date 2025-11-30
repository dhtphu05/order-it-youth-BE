import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { PaymentsService } from './payments.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { PaymentRecordDto } from './dto/payment-record.dto';

type RequestWithUser = Request & {
  user?: {
    sub?: string;
    id?: string;
    role?: string;
    roles?: string[];
  };
};

@ApiTags('Admin – Payments')
@ApiBearerAuth('admin-jwt')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Confirm payment manually',
    description:
      'Admin xác nhận thanh toán chuyển khoản cho một order dựa trên sao kê ngân hàng.',
  })
  @ApiBody({ type: ConfirmPaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment confirmed and order marked as paid.',
    type: PaymentRecordDto,
  })
  @ApiResponse({
    status: 400,
    description: 'AMOUNT_MISMATCH or ORDER_NOT_PENDING',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'ORDER_NOT_FOUND',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'DUPLICATE_TRANSACTION_ID',
    type: ErrorResponseDto,
  })
  confirm(@Body() dto: ConfirmPaymentDto, @Req() req: RequestWithUser) {
    const adminUserId =
      req.user?.sub ?? req.user?.id ?? null;
    return this.paymentsService.confirm(dto, adminUserId);
  }
}
