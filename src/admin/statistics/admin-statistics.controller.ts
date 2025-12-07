import {
    Controller,
    Get,
    Query,
    UseGuards,
    Req,
    ForbiddenException,
} from '@nestjs/common';
import { AdminStatisticsService } from './admin-statistics.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { user_role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Admin Statistics')
@Controller('admin/statistics')
@UseGuards(JwtAuthGuard)
export class AdminStatisticsController {
    constructor(private readonly statisticsService: AdminStatisticsService) { }

    private validateAdmin(req: any) {
        const user = req.user;
        if (user?.role !== user_role.ADMIN) {
            throw new ForbiddenException('Access denied. Admin only.');
        }
    }

    @Get('overall')
    @ApiOperation({ summary: 'Get overall statistics (Revenue, Orders)' })
    @ApiQuery({ name: 'from', required: false, type: String })
    @ApiQuery({ name: 'to', required: false, type: String })
    async getOverallStats(
        @Req() req,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        this.validateAdmin(req);
        const fromDate = from ? new Date(from) : undefined;
        const toDate = to ? new Date(to) : undefined;
        return this.statisticsService.getOverallStats(fromDate, toDate);
    }

    @Get('teams')
    @ApiOperation({ summary: 'Get statistics breakdown by team' })
    @ApiQuery({ name: 'from', required: false, type: String })
    @ApiQuery({ name: 'to', required: false, type: String })
    async getTeamStats(
        @Req() req,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        this.validateAdmin(req);
        const fromDate = from ? new Date(from) : undefined;
        const toDate = to ? new Date(to) : undefined;
        return this.statisticsService.getTeamStats(fromDate, toDate);
    }
}
