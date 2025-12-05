import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TeamOrdersController } from './team-orders.controller';
import { TeamOrdersService } from './team-orders.service';
import { TeamShipmentsController } from './team-shipments.controller';
import { TeamShipmentsService } from './team-shipments.service';

@Module({
  imports: [PrismaModule],
  controllers: [TeamOrdersController, TeamShipmentsController],
  providers: [TeamOrdersService, TeamShipmentsService],
})
export class TeamModule {}