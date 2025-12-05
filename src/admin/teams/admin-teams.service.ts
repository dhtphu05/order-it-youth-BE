import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdminAddTeamMemberDto,
  AdminCreateTeamDto,
  AdminTeamListQueryDto,
  AdminTeamResponseDto,
  AdminUpdateTeamDto,
} from './dto/admin-team.dto';

type TeamWithMembers = Prisma.teamsGetPayload<{
  include: {
    members: {
      include: { user: true };
      orderBy: { created_at: 'asc' };
    };
  };
}>;

@Injectable()
export class AdminTeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminTeamListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.teamsWhereInput = {};

    const q = query.q?.trim();
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (query.isActive !== undefined) {
      where.is_active = query.isActive;
    }

    const [total, teams] = await Promise.all([
      this.prisma.teams.count({ where }),
      this.prisma.teams.findMany({
        where,
        include: this.teamInclude(),
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      data: teams.map((team) => this.mapTeam(team)),
    };
  }

  async get(id: string): Promise<AdminTeamResponseDto> {
    const team = await this.prisma.teams.findUnique({
      where: { id },
      include: this.teamInclude(),
    });
    if (!team) {
      throw new NotFoundException({
        error_code: 'TEAM_NOT_FOUND',
        message: 'Team not found',
      });
    }
    return this.mapTeam(team);
  }

  async create(dto: AdminCreateTeamDto) {
    try {
      const created = await this.prisma.teams.create({
        data: {
          name: dto.name,
          code: dto.code,
          is_active: dto.isActive ?? true,
        },
      });
      return this.get(created.id);
    } catch (error) {
      this.handleTeamUniqueErrors(error);
      throw error;
    }
  }

  async update(id: string, dto: AdminUpdateTeamDto) {
    await this.ensureTeamExists(id);
    const data: Prisma.teamsUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.code !== undefined) {
      data.code = dto.code;
    }
    if (dto.isActive !== undefined) {
      data.is_active = dto.isActive;
    }

    try {
      await this.prisma.teams.update({
        where: { id },
        data,
      });
      return this.get(id);
    } catch (error) {
      this.handleTeamUniqueErrors(error);
      throw error;
    }
  }

  async disable(id: string) {
    await this.ensureTeamExists(id);
    await this.prisma.teams.update({
      where: { id },
      data: { is_active: false },
    });
    return { ok: true };
  }

  async addMember(teamId: string, dto: AdminAddTeamMemberDto) {
    await this.ensureTeamExists(teamId);
    await this.ensureUserExists(dto.userId);

    try {
      await this.prisma.team_members.create({
        data: {
          team_id: teamId,
          user_id: dto.userId,
          role: dto.role,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraint(error, 'team_id_user_id')) {
        throw new ConflictException({
          error_code: 'ALREADY_TEAM_MEMBER',
          message: 'User is already a member of this team.',
        });
      }
      throw error;
    }

    return this.get(teamId);
  }

  async removeMember(teamId: string, memberId: string) {
    const member = await this.prisma.team_members.findUnique({
      where: { id: memberId },
    });
    if (!member || member.team_id !== teamId) {
      throw new NotFoundException({
        error_code: 'TEAM_MEMBER_NOT_FOUND',
        message: 'Team member not found for this team.',
      });
    }

    await this.prisma.team_members.delete({
      where: { id: memberId },
    });
    return { ok: true };
  }

  private teamInclude() {
    return {
      members: {
        include: { user: true },
        orderBy: { created_at: 'asc' },
      },
    } as const;
  }

  private mapTeam(team: TeamWithMembers): AdminTeamResponseDto {
    return {
      id: team.id,
      name: team.name,
      code: team.code,
      isActive: team.is_active,
      createdAt: team.created_at.toISOString(),
      updatedAt: team.updated_at.toISOString(),
      members: team.members?.map((member) => ({
        id: member.id,
        userId: member.user_id,
        role: member.role,
        fullName: member.user?.full_name ?? undefined,
        email: member.user?.email ?? undefined,
      })),
    };
  }

  private async ensureTeamExists(id: string) {
    const team = await this.prisma.teams.findUnique({ where: { id } });
    if (!team) {
      throw new NotFoundException({
        error_code: 'TEAM_NOT_FOUND',
        message: 'Team not found',
      });
    }
    return team;
  }

  private async ensureUserExists(id: string) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException({
        error_code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }
    return user;
  }

  private handleTeamUniqueErrors(error: unknown) {
    if (this.isUniqueConstraint(error, 'code')) {
      throw new ConflictException({
        error_code: 'TEAM_CODE_TAKEN',
        message: 'Team code already exists.',
      });
    }
  }

  private isUniqueConstraint(error: unknown, target: string) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const metaTarget = error.meta?.target;
      if (Array.isArray(metaTarget)) {
        return metaTarget.some((entry) =>
          typeof entry === 'string' ? entry.includes(target) : false,
        );
      }
      if (typeof metaTarget === 'string') {
        return metaTarget.includes(target);
      }
    }
    return false;
  }
}
