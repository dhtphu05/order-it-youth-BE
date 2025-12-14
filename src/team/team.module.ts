
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TeamOrdersController } from './team-orders.controller';
import { TeamOrdersService } from './team-orders.service';
import { TeamStatisticsController } from './team-statistics.controller';
import { TeamStatisticsService } from './team-statistics.service';
import { TeamShipmentsController } from './team-shipments.controller';
import { TeamShipmentsService } from './team-shipments.service';
import { PublicShipmentsController } from './public-shipments.controller';
import { PublicTeamsController } from './public-teams.controller';
import { PublicTeamsService } from './public-teams.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    TeamShipmentsController,
    TeamOrdersController,
    TeamStatisticsController,
    PublicShipmentsController,
    PublicTeamsController,
  ],
  providers: [
    TeamShipmentsService,
    TeamOrdersService,
    TeamStatisticsService,
    PublicTeamsService,
  ],
})
export class TeamModule { }
