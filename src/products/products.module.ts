import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CombosController, ProductsController } from './products.controller';

@Module({
  controllers: [ProductsController, CombosController],
  providers: [ProductsService],
})
export class ProductsModule {}
