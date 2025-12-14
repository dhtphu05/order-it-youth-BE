
import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicTeamsService } from './public-teams.service';

@ApiTags('public-teams')
@Controller('public/teams')
export class PublicTeamsController {
    constructor(private readonly publicTeamsService: PublicTeamsService) { }

    @Get()
    @ApiOperation({ summary: 'List all active teams' })
    async listTeams() {
        return this.publicTeamsService.listActiveTeams();
    }

    @Get(':code/members')
    @ApiOperation({ summary: 'List members of a specific team by code' })
    async listTeamMembers(@Param('code') code: string) {
        return this.publicTeamsService.getTeamMembers(code);
    }
}
