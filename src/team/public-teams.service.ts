
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PublicTeamsService {
    constructor(private readonly prisma: PrismaService) { }

    async listActiveTeams() {
        return this.prisma.teams.findMany({
            where: { is_active: true },
            select: {
                id: true,
                code: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });
    }

    async getTeamMembers(teamCode: string) {
        const team = await this.prisma.teams.findUnique({
            where: { code: teamCode },
            select: { id: true },
        });

        if (!team) {
            throw new NotFoundException('TEAM_NOT_FOUND');
        }

        const members = await this.prisma.team_members.findMany({
            where: { team_id: team.id },
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        phone: true,
                    },
                },
            },
        });

        return members.map((m) => ({
            ...m.user,
            role: m.role, // Optional: might be useful for FE to filter managers
        }));
    }
}
