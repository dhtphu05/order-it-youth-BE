import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Delete,
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
  AdminConfirmPaymentDto,
  AdminOrderListQueryDto,
} from './dto/admin-order.dto';
import {
  AdminCancelOrderDto,
  AdminCompleteFulfilmentDto,
  AdminFailFulfilmentDto,
  AdminRetryFulfilmentDto,
  AdminStartFulfilmentDto,
} from './dto/admin-fulfilment.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { OrderResponseDto } from '../../orders/dto/order-response.dto';

@ApiTags('Admin – Orders')
@ApiBearerAuth('admin-jwt')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly service: AdminOrdersService) { }

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

  @Post(':code/fulfilment-start')
  @ApiOperation({
    summary: 'Start fulfilment',
    description: 'Transition an order from PAID to FULFILLING before delivery attempts.',
  })
  @ApiParam({
    name: 'code',
    type: String,
    description: 'Order code to transition.',
  })
  @ApiBody({ type: AdminStartFulfilmentDto })
  @ApiResponse({
    status: 200,
    description: 'Order marked as fulfilling.',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'ORDER_NOT_FOUND',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'INVALID_STATUS_TRANSITION',
    type: ErrorResponseDto,
  })
  startFulfilment(
    @Param('code') code: string,
    @Body() dto: AdminStartFulfilmentDto,
  ) {
    return this.service.startFulfilment(code, dto);
  }

  @Post(':code/fulfilment-fail')
  @ApiOperation({
    summary: 'Record failed delivery',
    description:
      'Record a failed delivery attempt (e.g., customer no-show) while in FULFILLING.',
  })
  @ApiParam({
    name: 'code',
    type: String,
    description: 'Order code that encountered a failed delivery.',
  })
  @ApiBody({ type: AdminFailFulfilmentDto })
  @ApiResponse({
    status: 200,
    description: 'Order marked as delivery failed.',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'ORDER_NOT_FOUND',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'INVALID_STATUS_TRANSITION',
    type: ErrorResponseDto,
  })
  failFulfilment(
    @Param('code') code: string,
    @Body() dto: AdminFailFulfilmentDto,
  ) {
    return this.service.failFulfilment(code, dto);
  }

  @Post(':code/fulfilment-retry')
  @ApiOperation({
    summary: 'Retry fulfilment',
    description: 'Move an order from DELIVERY_FAILED back to FULFILLING.',
  })
  @ApiParam({
    name: 'code',
    type: String,
    description: 'Order code to retry.',
  })
  @ApiBody({ type: AdminRetryFulfilmentDto })
  @ApiResponse({
    status: 200,
    description: 'Order marked as fulfilling again.',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'ORDER_NOT_FOUND',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'INVALID_STATUS_TRANSITION',
    type: ErrorResponseDto,
  })
  retryFulfilment(
    @Param('code') code: string,
    @Body() dto: AdminRetryFulfilmentDto,
  ) {
    return this.service.retryFulfilment(code, dto);
  }

  @Post(':code/fulfilment-complete')
  @ApiOperation({
    summary: 'Complete fulfilment',
    description: 'Mark a fulfilling order as fulfilled and record the completion time.',
  })
  @ApiParam({
    name: 'code',
    type: String,
    description: 'Order code to mark as fulfilled.',
  })
  @ApiBody({ type: AdminCompleteFulfilmentDto })
  @ApiResponse({
    status: 200,
    description: 'Order marked as fulfilled.',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'ORDER_NOT_FOUND',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'INVALID_STATUS_TRANSITION',
    type: ErrorResponseDto,
  })
  completeFulfilment(
    @Param('code') code: string,
    @Body() dto: AdminCompleteFulfilmentDto,
  ) {
    return this.service.completeFulfilment(code, dto);
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
  @ApiResponse({
    status: 200,
    description: 'Order cancelled.',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'ORDER_NOT_FOUND',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'INVALID_STATUS_TRANSITION',
    type: ErrorResponseDto,
  })
  cancel(@Param('code') code: string, @Body() dto: AdminCancelOrderDto) {
    return this.service.cancel(code, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete order',
    description: 'Permanently delete an order and its associated data (items, payments, shipments).',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Order UUID to delete.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found.',
  })
  delete(@Param('id') id: string) {
    return this.service.deleteOrder(id);
  }
}
