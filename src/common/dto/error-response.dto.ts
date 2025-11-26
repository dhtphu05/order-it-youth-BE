import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ description: 'Stable machine-readable error code.' })
  error_code: string;

  @ApiProperty({ description: 'Human-readable message for display/debug.' })
  message: string;

  @ApiPropertyOptional({
    description:
      'Optional structured details. Can contain arrays (e.g. price changes, stock issues).',
  })
  details?: unknown;

  @ApiPropertyOptional({
    description:
      'Optional list of error items (e.g. variants that changed price or ran out of stock).',
    type: 'object',
    isArray: true,
  })
  items?: unknown[];
}
