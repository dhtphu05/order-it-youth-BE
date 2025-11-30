import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { fulfillment_type, OrderStatus, payment_method, payment_status } from '@prisma/client';

export class OrderItemResponseDto {
  @ApiProperty()
  title: string;

  @ApiProperty({ format: 'uuid', nullable: true, required: false })
  variant_id: string | null;

  @ApiProperty({ format: 'uuid', nullable: true, required: false })
  combo_id: string | null;

  @ApiProperty({ type: 'integer' })
  unit_price_vnd: number;

  @ApiProperty({ type: 'integer' })
  quantity: number;

  @ApiProperty({ type: 'integer' })
  line_total_vnd: number;
}

export class OrderResponseDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ enum: fulfillment_type })
  fulfillment_type: fulfillment_type;

  @ApiProperty({ enum: payment_method })
  payment_method: payment_method;

  @ApiProperty({ enum: payment_status })
  payment_status: payment_status;

  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.CREATED,
    description:
      'High-level lifecycle status for the order (CREATED → PAID → FULFILLING → DELIVERY_FAILED → FULFILLED → CANCELLED).',
  })
  order_status: OrderStatus;

  @ApiProperty({
    type: 'integer',
    example: 0,
    description: 'Number of delivery attempts recorded so far.',
  })
  delivery_attempts: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Timestamp when the last delivery attempt failed.',
  })
  delivery_failed_at?: Date;

  @ApiPropertyOptional({
    type: String,
    description: 'Recorded reason for the last failed delivery attempt.',
  })
  delivery_failed_reason?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Timestamp when the order was fulfilled.',
  })
  fulfilled_at?: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Timestamp when the order was cancelled.',
  })
  cancelled_at?: Date;

  @ApiPropertyOptional({
    type: String,
    description: 'Recorded reason for cancellation.',
  })
  cancelled_reason?: string;

  @ApiProperty({ type: 'integer' })
  grand_total_vnd: number;

  @ApiProperty({ type: () => [OrderItemResponseDto] })
  items: OrderItemResponseDto[];
}
