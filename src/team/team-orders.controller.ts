import {
  Controller,
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
  constructor(private readonly teamOrdersService: TeamOrdersService) {}

  @Get()
  async listOrders(@Req() req, @Query() query: TeamOrderListQueryDto) {
    const { teamIds } = (req as any).teamContext;
    return this.teamOrdersService.listOrdersForTeams(teamIds, query);
  }

  @Get(':code')
  async getOrder(@Req() req, @Param('code') code: string) {
    const { teamIds } = (req as any).teamContext;
    return this.teamOrdersService.getOrderForTeams(teamIds, code);
  }
}