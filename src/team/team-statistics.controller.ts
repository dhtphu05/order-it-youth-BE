import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { TeamStatisticsService } from './team-statistics.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { TeamGuard } from 'src/auth/team.guard';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TeamContext } from 'src/common/interfaces/team-context.interface';

@ApiTags('Team Statistics')
@Controller('team/statistics')
@UseGuards(JwtAuthGuard, TeamGuard)
export class TeamStatisticsController {
    constructor(private readonly statisticsService: TeamStatisticsService) { }

    @Get()
    @ApiOperation({ summary: 'Get statistics for my teams' })
    @ApiQuery({ name: 'from', required: false, type: String })
    @ApiQuery({ name: 'to', required: false, type: String })
    async getMyTeamStats(
        @Req() req: Request,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        const teamContext = (req as any).teamContext as TeamContext;
        const fromDate = from ? new Date(from) : undefined;
        const toDate = to ? new Date(to) : undefined;

        return this.statisticsService.getTeamStats(
            teamContext.teamIds,
            fromDate,
            toDate,
        );
    }
}
