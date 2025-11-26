import { Module } from '@nestjs/common';
import { AdminCombosController } from './admin-combos.controller';
import { AdminCombosService } from './admin-combos.service';
import { CloudinaryModule } from '../../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [AdminCombosController],
  providers: [AdminCombosService],
})
export class AdminCombosModule {}
