import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const userRoles = this.extractRoles(user.role, user.roles);
    const allowed = requiredRoles.some((role) =>
      userRoles.includes(role),
    );

    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  private extractRoles(
    role?: unknown,
    roles?: unknown,
  ): string[] {
    if (Array.isArray(roles)) {
      return roles.filter((entry): entry is string => typeof entry === 'string');
    }

    if (typeof role === 'string' && role.length > 0) {
      return [role];
    }

    return [];
  }
}
