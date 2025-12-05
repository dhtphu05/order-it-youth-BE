import { Module } from '@nestjs/common';
import { AdminTeamsController } from './admin-teams.controller';
import { AdminTeamsService } from './admin-teams.service';

@Module({
  controllers: [AdminTeamsController],
  providers: [AdminTeamsService],
})
export class AdminTeamsModule {}
