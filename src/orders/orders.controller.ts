import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { PaymentIntentResponseDto } from './dto/payment-intent-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Khởi tạo checkout công khai' })
  @ApiBody({ type: CheckoutOrderDto })
  @ApiCreatedResponse({
    description: 'Tạo order thành công.',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Idempotency in progress hoặc hết hàng / lệch giá.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Yêu cầu không hợp lệ (ví dụ combo/variant không tồn tại).',
    type: ErrorResponseDto,
  })
  checkout(@Body() dto: CheckoutOrderDto) {
    return this.ordersService.checkout(dto);
  }

  @Get(':code/payment-intent')
  @ApiOperation({ summary: 'Lấy thông tin thanh toán VietQR' })
  @ApiOkResponse({
    description: 'Thông tin thanh toán hoặc trạng thái hiện tại của đơn hàng.',
    type: PaymentIntentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy order.',
    type: ErrorResponseDto,
  })
  getPaymentIntent(@Param('code') code: string) {
    return this.ordersService.getPaymentIntent(code);
  }
}
