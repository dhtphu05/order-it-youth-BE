import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeamContext } from '../common/interfaces/team-context.interface';
import { user_role } from '@prisma/client';

@Injectable()
export class TeamGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (user.role === user_role.ADMIN) {
      (request as any).teamContext = this.buildAdminContext();
      return true;
    }

    const memberships = await this.prisma.team_members.findMany({
      where: { user_id: user.id },
    });

    if (!memberships.length) {
      throw new ForbiddenException('NO_TEAM_MEMBERSHIP');
    }

    const teamContext: TeamContext = {
      teamIds: memberships.map((membership) => membership.team_id),
      rolesByTeam: memberships.reduce<Record<string, string>>((acc, membership) => {
        acc[membership.team_id] = membership.role;
        return acc;
      }, {}),
    };

    (request as any).teamContext = teamContext;
    return true;
  }

  private buildAdminContext(): TeamContext {
    return { teamIds: [], rolesByTeam: {} };
  }
}
