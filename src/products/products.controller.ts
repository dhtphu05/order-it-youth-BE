import { Controller, Get } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  listProducts() {
    return this.productsService.listProducts();
  }
}

@Controller('combos')
export class CombosController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  listCombos() {
    return this.productsService.listActiveCombos();
  }
}
