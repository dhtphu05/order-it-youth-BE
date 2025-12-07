import { Module } from '@nestjs/common';
import { AdminStatisticsController } from './admin-statistics.controller';
import { AdminStatisticsService } from './admin-statistics.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
    controllers: [AdminStatisticsController],
    providers: [AdminStatisticsService, PrismaService],
})
export class AdminStatisticsModule { }
