import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
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
import { user_role } from '@prisma/client';
import { AdminTeamsService } from './admin-teams.service';
import {
  AdminAddTeamMemberDto,
  AdminCreateTeamDto,
  AdminTeamListQueryDto,
  AdminTeamResponseDto,
  AdminUpdateTeamDto,
} from './dto/admin-team.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('Admin – Teams')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(user_role.ADMIN)
@Controller('admin/teams')
export class AdminTeamsController {
  constructor(private readonly service: AdminTeamsService) {}

  @Get()
  @ApiOperation({
    summary: 'List teams',
    description:
      'Paginated list of teams with optional keyword search and isActive filter.',
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
    description: 'Items per page (default 20).',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Keyword to match against team name or code.',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated teams returned.',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'integer', example: 1 },
        page: { type: 'integer', example: 1 },
        limit: { type: 'integer', example: 20 },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/AdminTeamResponseDto' },
        },
      },
    },
  })
  list(@Query() query: AdminTeamListQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a team',
    description: 'Return a single team with members.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Team ID (UUID).',
  })
  @ApiResponse({
    status: 200,
    description: 'Team found.',
    type: AdminTeamResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'TEAM_NOT_FOUND',
    type: ErrorResponseDto,
  })
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a team',
    description: 'Create a new admin-managed team.',
  })
  @ApiBody({ type: AdminCreateTeamDto })
  @ApiResponse({
    status: 201,
    description: 'Team created.',
    type: AdminTeamResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'TEAM_CODE_TAKEN',
    type: ErrorResponseDto,
  })
  create(@Body() dto: AdminCreateTeamDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a team',
    description: 'Update team metadata or active flag.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Team ID (UUID).',
  })
  @ApiBody({ type: AdminUpdateTeamDto })
  @ApiResponse({
    status: 200,
    description: 'Team updated.',
    type: AdminTeamResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'TEAM_NOT_FOUND',
    type: ErrorResponseDto,
  })
  update(@Param('id') id: string, @Body() dto: AdminUpdateTeamDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Disable a team',
    description: 'Soft-disable a team by setting isActive = false.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Team ID (UUID).',
  })
  @ApiResponse({
    status: 200,
    description: 'Team disabled.',
    schema: {
      type: 'object',
      properties: { ok: { type: 'boolean', example: true } },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'TEAM_NOT_FOUND',
    type: ErrorResponseDto,
  })
  disable(@Param('id') id: string) {
    return this.service.disable(id);
  }

  @Post(':id/members')
  @ApiOperation({
    summary: 'Add a team member',
    description: 'Link a user to the team with a role.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Team ID (UUID).',
  })
  @ApiBody({ type: AdminAddTeamMemberDto })
  @ApiResponse({
    status: 200,
    description: 'Member added.',
    type: AdminTeamResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'ALREADY_TEAM_MEMBER',
    type: ErrorResponseDto,
  })
  addMember(@Param('id') id: string, @Body() dto: AdminAddTeamMemberDto) {
    return this.service.addMember(id, dto);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({
    summary: 'Remove a team member',
    description: 'Detach a user from the specified team.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Team ID (UUID).',
  })
  @ApiParam({
    name: 'memberId',
    type: String,
    description: 'Team member ID (UUID).',
  })
  @ApiResponse({
    status: 200,
    description: 'Member removed.',
    schema: {
      type: 'object',
      properties: { ok: { type: 'boolean', example: true } },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'TEAM_MEMBER_NOT_FOUND',
    type: ErrorResponseDto,
  })
  removeMember(@Param('id') id: string, @Param('memberId') memberId: string) {
    return this.service.removeMember(id, memberId);
  }
}
