import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { TeamGuard } from 'src/auth/team.guard';
import { TeamContext } from 'src/common/interfaces/team-context.interface';
import { TeamShipmentsService } from './team-shipments.service';
import {
  TeamAssignOrderDto,
  TeamMarkFailedDto,
  TeamMyShipmentsQueryDto,
  TeamStartDeliveryDto,
  TeamUnassignedShipmentsQueryDto,
} from './dto/team-shipments.dto';
import type { Request } from 'express';

@Controller()
@UseGuards(JwtAuthGuard, TeamGuard)
export class TeamShipmentsController {
  constructor(private readonly teamShipmentsService: TeamShipmentsService) { }

  @Get('team/shipments/unassigned')
  async listUnassigned(
    @Req() req: Request,
    @Query() query: TeamUnassignedShipmentsQueryDto,
  ) {
    const teamContext = (req as any).teamContext as TeamContext;
    return this.teamShipmentsService.listUnassignedOrdersForTeams(
      teamContext.teamIds,
      query,
    );
  }

  @Get('team/my-shipments')
  async listMyShipments(
    @Req() req: Request,
    @Query() query: TeamMyShipmentsQueryDto,
  ) {
    const user = (req as any).user;
    return this.teamShipmentsService.listMyShipments(user.id, query);
  }

  @Post('team/orders/:code/assign-self')
  async assignSelf(@Req() req: Request, @Param('code') code: string) {
    const user = (req as any).user;
    const teamContext = (req as any).teamContext as TeamContext;
    await this.teamShipmentsService.assignSelfToOrder(user, teamContext, code);
    return { ok: true };
  }

  @Post('team/orders/:code/unassign-self')
  async unassignSelf(@Req() req: Request, @Param('code') code: string) {
    const user = (req as any).user;
    const teamContext = (req as any).teamContext as TeamContext;
    await this.teamShipmentsService.unassignSelf(user, teamContext, code);
    return { ok: true };
  }

  @Post('team/orders/:code/assign')
  async assignToUser(
    @Req() req: Request,
    @Param('code') code: string,
    @Body() dto: TeamAssignOrderDto,
  ) {
    const user = (req as any).user;
    const teamContext = (req as any).teamContext as TeamContext;
    await this.teamShipmentsService.assignOrderToUserAsManager(
      user,
      teamContext,
      code,
      dto,
    );
    return { ok: true };
  }

  @Post('team/orders/:code/start-delivery')
  async startDelivery(
    @Req() req: Request,
    @Param('code') code: string,
    @Body() dto: TeamStartDeliveryDto,
  ) {
    const user = (req as any).user;
    const teamContext = (req as any).teamContext as TeamContext;
    await this.teamShipmentsService.startDelivery(user, teamContext, code, dto);
    return { ok: true };
  }

  @Post('team/orders/:code/mark-delivered')
  async markDelivered(@Req() req: Request, @Param('code') code: string) {
    const user = (req as any).user;
    const teamContext = (req as any).teamContext as TeamContext;
    await this.teamShipmentsService.markDelivered(user, teamContext, code);
    return { ok: true };
  }

  @Post('team/orders/:code/mark-failed')
  async markFailed(
    @Req() req: Request,
    @Param('code') code: string,
    @Body() dto: TeamMarkFailedDto,
  ) {
    const user = (req as any).user;
    const teamContext = (req as any).teamContext as TeamContext;
    await this.teamShipmentsService.markFailed(user, teamContext, code, dto);
    return { ok: true };
  }
}