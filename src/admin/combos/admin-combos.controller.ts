import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { AdminCombosService } from './admin-combos.service';
import {
  AdminComboListQueryDto,
  AdminCreateComboDto,
  AdminUpdateComboDto,
} from './dto/admin-combo.dto';

@ApiTags('Admin – Combos')
@ApiBearerAuth('admin-jwt')
@Controller('admin/combos')
export class AdminCombosController {
  constructor(private readonly service: AdminCombosService) {}

  @Get()
  @ApiOperation({
    summary: 'List combos',
    description:
      'Get a paginated list of combos with optional search and active filters.',
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
    name: 'q',
    required: false,
    type: String,
    description: 'Search keyword for combo name or slug.',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter combos by active status.',
  })
  @ApiResponse({ status: 200, description: 'Paginated combos returned.' })
  list(@Query() query: AdminComboListQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get combo detail',
    description: 'Return combo detail with its components and variants.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Combo ID (UUID).',
  })
  @ApiResponse({ status: 200, description: 'Combo found.' })
  @ApiResponse({ status: 404, description: 'Combo not found.' })
  get(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create combo',
    description: 'Create a combo along with its components configuration.',
  })
  @ApiBody({ type: AdminCreateComboDto })
  @ApiResponse({ status: 201, description: 'Combo created.' })
  @ApiResponse({ status: 400, description: 'Validation or slug conflict.' })
  create(@Body() dto: AdminCreateComboDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update combo',
    description:
      'Update combo metadata, pricing, activation status or components.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Combo ID (UUID).',
  })
  @ApiBody({ type: AdminUpdateComboDto })
  @ApiResponse({ status: 200, description: 'Combo updated.' })
  @ApiResponse({ status: 404, description: 'Combo not found.' })
  update(@Param('id') id: string, @Body() dto: AdminUpdateComboDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete combo',
    description: 'Delete a combo when it is no longer used.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Combo ID (UUID).',
  })
  @ApiResponse({ status: 200, description: 'Combo deleted.' })
  @ApiResponse({ status: 404, description: 'Combo not found.' })
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
