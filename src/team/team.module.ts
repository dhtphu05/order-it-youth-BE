
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TeamOrdersController } from './team-orders.controller';
import { TeamOrdersService } from './team-orders.service';
import { TeamStatisticsController } from './team-statistics.controller';
import { TeamStatisticsService } from './team-statistics.service';
import { TeamShipmentsController } from './team-shipments.controller';
import { TeamShipmentsService } from './team-shipments.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    TeamShipmentsController,
    TeamOrdersController,
    TeamStatisticsController,
  ],
  providers: [
    TeamShipmentsService,
    TeamOrdersService,
    TeamStatisticsService,
  ],
})
export class TeamModule { }
