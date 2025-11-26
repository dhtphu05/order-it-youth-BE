import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminOrdersService } from './admin-orders.service';
import {
  AdminCancelOrderDto,
  AdminConfirmPaymentDto,
  AdminDeliverOrderDto,
  AdminOrderListQueryDto,
} from './dto/admin-order.dto';

@ApiTags('Admin – Orders')
@ApiBearerAuth('admin-jwt')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly service: AdminOrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'List orders',
    description:
      'Get a paginated list of orders with filters for payment status, fulfillment type, search keyword and date range.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default 1).',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default 20, max 100).',
  })
  @ApiQuery({
    name: 'paymentStatus',
    required: false,
    type: String,
    description: 'Filter by payment status (PENDING, SUCCESS, FAILED, REFUNDED).',
  })
  @ApiQuery({
    name: 'fulfillmentType',
    required: false,
    type: String,
    description: 'Filter by fulfillment type (DELIVERY, PICKUP_SCHOOL).',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Search keyword for order code, customer name, phone or email.',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'Start date (ISO string).',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'End date (ISO string).',
  })
  @ApiResponse({ status: 200, description: 'Paginated orders returned.' })
  list(@Query() query: AdminOrderListQueryDto) {
    return this.service.list(query);
  }

  @Get(':code')
  @ApiOperation({
    summary: 'Get order detail',
    description: 'Fetch an order by its code with items, payments and shipment.',
  })
  @ApiParam({
    name: 'code',
    type: String,
    description: 'Order code (e.g. OIY-2026-00045).',
  })
  @ApiResponse({ status: 200, description: 'Order detail returned.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  get(@Param('code') code: string) {
    return this.service.getByCode(code);
  }

  @Post(':code/confirm-payment')
  @ApiOperation({
    summary: 'Confirm payment manually',
    description:
      'Confirm an offline payment for an order. Updates payments, order status and audit log.',
  })
  @ApiParam({
    name: 'code',
    type: String,
    description: 'Order code to confirm payment for.',
  })
  @ApiBody({ type: AdminConfirmPaymentDto })
  @ApiResponse({
    status: 200,
    description: 'Payment confirmed and order marked as paid.',
  })
  @ApiResponse({ status: 400, description: 'Amount mismatch or invalid data.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @ApiResponse({
    status: 409,
    description: 'Duplicate transaction ID or order already processed.',
  })
  confirmPayment(
    @Param('code') code: string,
    @Body() dto: AdminConfirmPaymentDto,
  ) {
    return this.service.confirmPayment(code, dto);
  }

  @Post(':code/cancel')
  @ApiOperation({
    summary: 'Cancel order',
    description: 'Cancel a pending order and write an audit log.',
  })
  @ApiParam({
    name: 'code',
    type: String,
    description: 'Order code to cancel.',
  })
  @ApiBody({ type: AdminCancelOrderDto })
  @ApiResponse({ status: 200, description: 'Order cancelled.' })
  @ApiResponse({ status: 404, description: 'Order not found or not cancellable.' })
  cancel(@Param('code') code: string, @Body() dto: AdminCancelOrderDto) {
    return this.service.cancel(code, dto);
  }

  @Post(':code/deliver')
  @ApiOperation({
    summary: 'Mark delivered',
    description:
      'Mark a paid order as delivered and optionally create/update shipment record.',
  })
  @ApiParam({
    name: 'code',
    type: String,
    description: 'Order code to mark as delivered.',
  })
  @ApiBody({ type: AdminDeliverOrderDto })
  @ApiResponse({ status: 200, description: 'Order delivery recorded.' })
  @ApiResponse({ status: 400, description: 'Order not paid yet.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  deliver(@Param('code') code: string, @Body() dto: AdminDeliverOrderDto) {
    return this.service.markDelivered(code, dto);
  }
}
