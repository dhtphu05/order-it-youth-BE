import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  ComboResponseDto,
  ProductResponseDto,
} from './dto/product-response.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách sản phẩm + variants' })
  @ApiOkResponse({
    type: ProductResponseDto,
    isArray: true,
    description: 'Danh sách sản phẩm cùng các biến thể.',
  })
  listProducts() {
    return this.productsService.listProducts();
  }
}

@ApiTags('Combos')
@Controller('combos')
export class CombosController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách combo + components' })
  @ApiOkResponse({
    type: ComboResponseDto,
    isArray: true,
    description: 'Danh sách combo đang hoạt động.',
  })
  listCombos() {
    return this.productsService.listActiveCombos();
  }
}
