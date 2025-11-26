import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AdminOrdersService } from './admin-orders.service';
import {
  AdminCancelOrderDto,
  AdminConfirmPaymentDto,
  AdminDeliverOrderDto,
  AdminOrderListQueryDto,
} from './dto/admin-order.dto';

@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly service: AdminOrdersService) {}

  @Get()
  list(@Query() query: AdminOrderListQueryDto) {
    return this.service.list(query);
  }

  @Get(':code')
  get(@Param('code') code: string) {
    return this.service.getByCode(code);
  }

  @Post(':code/confirm-payment')
  confirmPayment(
    @Param('code') code: string,
    @Body() dto: AdminConfirmPaymentDto,
  ) {
    return this.service.confirmPayment(code, dto);
  }

  @Post(':code/cancel')
  cancel(@Param('code') code: string, @Body() dto: AdminCancelOrderDto) {
    return this.service.cancel(code, dto);
  }

  @Post(':code/deliver')
  deliver(@Param('code') code: string, @Body() dto: AdminDeliverOrderDto) {
    return this.service.markDelivered(code, dto);
  }
}
