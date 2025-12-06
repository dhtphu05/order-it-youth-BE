import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { user_role } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import {
  AdminCreateUserDto,
  AdminUpdateUserDto,
  AdminUserListQueryDto,
} from './dto/admin-user.dto';
import { AdminUsersService } from './admin-users.service';

@ApiTags('Admin – Users')
@ApiBearerAuth('admin-jwt')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(user_role.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  list(@Query() query: AdminUserListQueryDto) {
    return this.adminUsersService.list(query);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.adminUsersService.getById(id);
  }

  @Post()
  create(@Body() dto: AdminCreateUserDto) {
    return this.adminUsersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.adminUsersService.update(id, dto);
  }
}
