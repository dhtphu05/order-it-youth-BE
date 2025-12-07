import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TeamGuard } from 'src/auth/team.guard';
import { TeamOrdersService } from './team-orders.service';
import { TeamOrderListQueryDto } from './dto/team-order-list-query.dto';

@Controller('team/orders')
@UseGuards(JwtAuthGuard, TeamGuard)
export class TeamOrdersController {
  constructor(private readonly teamOrdersService: TeamOrdersService) { }

  @Get()
  async listOrders(@Req() req, @Query() query: TeamOrderListQueryDto) {
    const { teamIds, rolesByTeam, isAdmin } = (req as any).teamContext;

    const filteredTeamIds = isAdmin
      ? teamIds
      : teamIds.filter((id) => rolesByTeam[id] === 'STAFF');

    return this.teamOrdersService.listOrdersForTeams(
      filteredTeamIds,
      query,
      isAdmin,
    );
  }

  @Get(':code')
  async getOrder(@Req() req, @Param('code') code: string) {
    const { teamIds, rolesByTeam, isAdmin } = (req as any).teamContext;

    const filteredTeamIds = isAdmin
      ? teamIds
      : teamIds.filter((id) => rolesByTeam[id] === 'STAFF');

    return this.teamOrdersService.getOrderForTeams(
      filteredTeamIds,
      code,
      isAdmin,
    );
  }

  @Delete(':code')
  async deleteOrder(@Req() req, @Param('code') code: string) {
    const { teamIds, rolesByTeam, isAdmin } = (req as any).teamContext;

    const filteredTeamIds = isAdmin
      ? teamIds
      : teamIds.filter((id) => rolesByTeam[id] === 'STAFF');

    return this.teamOrdersService.deleteOrder(filteredTeamIds, code, isAdmin);
  }
}