import { Module } from '@nestjs/common';
import { AdminCombosController } from './admin-combos.controller';
import { AdminCombosService } from './admin-combos.service';

@Module({
  controllers: [AdminCombosController],
  providers: [AdminCombosService],
})
export class AdminCombosModule {}
