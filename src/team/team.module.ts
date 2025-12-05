import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TeamOrdersController } from './team-orders.controller';
import { TeamOrdersService } from './team-orders.service';

@Module({
  imports: [PrismaModule],
  controllers: [TeamOrdersController],
  providers: [TeamOrdersService],
})
export class TeamModule {}