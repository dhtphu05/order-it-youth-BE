import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { users, user_role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './jwt.strategy';

export type SafeUser = Omit<users, 'password_hash'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private sanitizeUser(user: users): SafeUser {
    const { password_hash, ...rest } = user;
    return rest;
  }

  async validateUser(email: string, password: string): Promise<SafeUser | null> {
    const user = await this.prisma.users.findUnique({ where: { email } });

    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as user_role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
