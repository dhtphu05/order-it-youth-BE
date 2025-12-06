import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, users } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdminCreateUserDto,
  AdminUpdateUserDto,
  AdminUserListQueryDto,
  AdminUserResponseDto,
} from './dto/admin-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(user: users): AdminUserResponseDto {
    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  async list(query: AdminUserListQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;

    const where: Prisma.usersWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.q) {
      const q = query.q.trim();
      if (q) {
        where.OR = [
          { full_name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ];
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.users.count({ where }),
      this.prisma.users.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return {
      total,
      page,
      limit,
      data: items.map((user) => this.toResponse(user)),
    };
  }

  async getById(id: string) {
    const user = await this.prisma.users.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    return this.toResponse(user);
  }

  async create(dto: AdminCreateUserDto) {
    const existing = await this.prisma.users.findUnique({ where: { email: dto.email } });

    if (existing) {
      throw new BadRequestException('EMAIL_TAKEN');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.users.create({
      data: {
        full_name: dto.full_name,
        email: dto.email,
        password_hash: passwordHash,
        role: dto.role,
        phone: dto.phone ?? null,
        meta: {},
      },
    });

    return this.toResponse(user);
  }

  async update(id: string, dto: AdminUpdateUserDto) {
    const existing = await this.prisma.users.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    const data: Prisma.usersUpdateInput = {};

    if (dto.full_name !== undefined) {
      data.full_name = dto.full_name;
    }

    if (dto.phone !== undefined) {
      data.phone = dto.phone ?? null;
    }

    if (dto.role !== undefined) {
      data.role = dto.role;
    }

    if (dto.newPassword) {
      data.password_hash = await bcrypt.hash(dto.newPassword, 10);
    }

    const updated = await this.prisma.users.update({
      where: { id },
      data,
    });

    return this.toResponse(updated);
  }
}
