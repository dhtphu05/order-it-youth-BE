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
    status: 200,
    description: 'Payment confirmed and order marked as paid.',
  })
  @ApiResponse({
    status: 400,
    description: 'Amount mismatch or invalid input.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Order already paid or duplicate transaction_id.',
    type: ErrorResponseDto,
  })
  confirm(@Body() dto: ConfirmPaymentDto, @Req() req: RequestWithUser) {
    const adminUserId =
      req.user?.sub ?? req.user?.id ?? null;
    return this.paymentsService.confirm(dto, adminUserId);
  }
}
