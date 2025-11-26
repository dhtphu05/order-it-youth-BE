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
import { AdminCombosService } from './admin-combos.service';
import {
  AdminComboListQueryDto,
  AdminCreateComboDto,
  AdminUpdateComboDto,
} from './dto/admin-combo.dto';

@Controller('admin/combos')
export class AdminCombosController {
  constructor(private readonly service: AdminCombosService) {}

  @Get()
  list(@Query() query: AdminComboListQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  create(@Body() dto: AdminCreateComboDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: AdminUpdateComboDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
