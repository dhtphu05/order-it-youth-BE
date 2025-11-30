import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 'PRICE_CHANGED' })
  error_code: string;

  @ApiProperty({ example: 'The item price has changed.' })
  message: string;

  @ApiPropertyOptional({
    description: 'Optional extra details.',
    type: 'object',
    additionalProperties: true,
  })
  details?: Record<string, any>;
}
