import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AdminStartFulfilmentDto {
  @ApiPropertyOptional({
    description: 'Optional note for the fulfilment task.',
    example: 'Volunteer assigned to pick up items after school.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminFailFulfilmentDto {
  @ApiProperty({
    example: 'CUSTOMER_NO_SHOW',
    description: 'Reason code for the failed delivery attempt.',
    enum: ['CUSTOMER_NO_SHOW', 'UNREACHABLE', 'WRONG_LOCATION', 'OTHER'],
  })
  @IsString()
  reason_code: string;

  @ApiPropertyOptional({
    example: 'Called twice, no answer.',
    description: 'Additional notes about the failure.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminRetryFulfilmentDto {
  @ApiPropertyOptional({
    description: 'Optional note for the retry attempt.',
    example: 'Retry scheduled for tomorrow morning.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminCompleteFulfilmentDto {
  @ApiPropertyOptional({
    description: 'Optional timestamp for when fulfilment completed.',
    example: '2025-12-20T09:00:00+07:00',
  })
  @IsOptional()
  @IsString()
  fulfilled_at?: string;

  @ApiPropertyOptional({
    description: 'Optional summary note for the completion.',
    example: 'Delivered at school gate; confirmed by teacher.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminCancelOrderDto {
  @ApiProperty({
    description: 'Reason for cancellation.',
    example: 'Customer unreachable after two attempts.',
  })
  @IsString()
  reason: string;
}
