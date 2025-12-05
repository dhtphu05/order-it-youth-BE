import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class AdminTeamListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Search keyword applied to team name or code (case-insensitive).',
    example: 'Alpha',
  })
  q?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1') {
        return true;
      }
      if (normalized === 'false' || normalized === '0') {
        return false;
      }
      return value;
    }
    return value;
  })
  @ApiPropertyOptional({
    description: 'Filter teams by active status.',
    example: true,
  })
  isActive?: boolean;
}

export class AdminCreateTeamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @ApiProperty({
    description: 'Display name of the team.',
    example: 'Central Fulfilment Team',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  @ApiProperty({
    description: 'Unique referral or team code.',
    example: 'TEAM-CENTRAL',
  })
  code: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Whether the team is currently active.',
    example: true,
  })
  isActive?: boolean;
}

export class AdminUpdateTeamDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @ApiPropertyOptional({ description: 'Updated team name.', example: 'Fulfilment Squad' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @ApiPropertyOptional({ description: 'Updated team code.', example: 'TEAM-SOUTH' })
  code?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Updated active flag.',
    example: false,
  })
  isActive?: boolean;
}

export class AdminAddTeamMemberDto {
  @IsUUID()
  @ApiProperty({
    description: 'User ID (UUID) to add to the team.',
    example: '7e23c950-b7d2-4ce9-916d-a1d1dbf8a3c6',
    format: 'uuid',
  })
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @ApiProperty({
    description: 'Role of the user inside the team (e.g. MANAGER, SHIPPER).',
    example: 'MANAGER',
  })
  role: string;
}

export class AdminTeamMemberDto {
  @ApiProperty({ description: 'Team member ID.', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'User ID associated with this membership.', format: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Role inside the team.' })
  role: string;

  @ApiPropertyOptional({ description: 'Full name loaded from the user profile.' })
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Email loaded from the user profile.',
    example: 'shipper@example.com',
  })
  email?: string;
}

export class AdminTeamResponseDto {
  @ApiProperty({ description: 'Team ID.', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Team name.' })
  name: string;

  @ApiProperty({ description: 'Unique team code.' })
  code: string;

  @ApiProperty({ description: 'Whether the team is active.' })
  isActive: boolean;

  @ApiProperty({
    description: 'ISO timestamp when the team was created.',
    type: String,
    format: 'date-time',
  })
  createdAt: string;

  @ApiProperty({
    description: 'ISO timestamp when the team was last updated.',
    type: String,
    format: 'date-time',
  })
  updatedAt: string;

  @ApiPropertyOptional({
    description: 'Team member list with user info.',
    type: () => [AdminTeamMemberDto],
  })
  @Type(() => AdminTeamMemberDto)
  members?: AdminTeamMemberDto[];
}
