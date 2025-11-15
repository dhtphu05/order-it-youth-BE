import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';

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
  checkout(@Body() dto: CheckoutOrderDto) {
    return this.ordersService.checkout(dto);
  }
}
