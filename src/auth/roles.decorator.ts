import { SetMetadata } from '@nestjs/common';
import { user_role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/*
Example usage:
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(user_role.ADMIN)
  class AdminTeamsController {}
*/
export const Roles = (...roles: user_role[]) => SetMetadata(ROLES_KEY, roles);
