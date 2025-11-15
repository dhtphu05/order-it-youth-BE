import { Body, Controller, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutOrderDto } from './dto/checkout-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  checkout(@Body() dto: CheckoutOrderDto) {
    return this.ordersService.checkout(dto);
  }
}
