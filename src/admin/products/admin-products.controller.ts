import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminProductsService } from './admin-products.service';
import {
  AdminCreateProductDto,
  AdminCreateVariantDto,
  AdminProductListQueryDto,
  AdminUpdateProductDto,
  AdminUpdateVariantDto,
} from './dto/admin-product.dto';

@ApiTags('Admin – Products')
@ApiBearerAuth('admin-jwt')
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly service: AdminProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'List products',
    description:
      'Get a paginated list of products with optional search by name, description, or SKU.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default 1).',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default 20, max 100).',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Search keyword for product name or SKU.',
  })
  @ApiResponse({ status: 200, description: 'Paginated products returned.' })
  list(@Query() query: AdminProductListQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product detail',
    description: 'Return a single product including its variants.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Product ID (UUID).',
  })
  @ApiResponse({ status: 200, description: 'Product found.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  get(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create product',
    description: 'Create a product with optional initial variants.',
  })
  @ApiBody({ type: AdminCreateProductDto })
  @ApiResponse({ status: 201, description: 'Product created.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  create(@Body() dto: AdminCreateProductDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update product',
    description: 'Update product name, description or donation flag.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Product ID (UUID).',
  })
  @ApiBody({ type: AdminUpdateProductDto })
  @ApiResponse({ status: 200, description: 'Product updated.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  update(@Param('id') id: string, @Body() dto: AdminUpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete product',
    description:
      'Delete a product (only allowed if business rules allow removing it).',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Product ID (UUID).',
  })
  @ApiResponse({ status: 200, description: 'Product deleted.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Post(':productId/variants')
  @ApiOperation({
    summary: 'Create variant',
    description: 'Add a new variant for the specified product.',
  })
  @ApiParam({
    name: 'productId',
    type: String,
    description: 'Parent product ID (UUID).',
  })
  @ApiBody({ type: AdminCreateVariantDto })
  @ApiResponse({ status: 201, description: 'Variant created.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  addVariant(
    @Param('productId') productId: string,
    @Body() dto: AdminCreateVariantDto,
  ) {
    return this.service.createVariant(productId, dto);
  }

  @Patch(':productId/variants/:variantId')
  @ApiOperation({
    summary: 'Update variant',
    description: 'Update SKU, options, price or stock for a variant.',
  })
  @ApiParam({
    name: 'productId',
    type: String,
    description: 'Parent product ID (UUID).',
  })
  @ApiParam({
    name: 'variantId',
    type: String,
    description: 'Variant ID (UUID).',
  })
  @ApiBody({ type: AdminUpdateVariantDto })
  @ApiResponse({ status: 200, description: 'Variant updated.' })
  @ApiResponse({ status: 404, description: 'Product or variant not found.' })
  updateVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: AdminUpdateVariantDto,
  ) {
    return this.service.updateVariant(productId, variantId, dto);
  }

  @Delete(':productId/variants/:variantId')
  @ApiOperation({
    summary: 'Delete variant',
    description: 'Remove a variant from the specified product.',
  })
  @ApiParam({
    name: 'productId',
    type: String,
    description: 'Parent product ID (UUID).',
  })
  @ApiParam({
    name: 'variantId',
    type: String,
    description: 'Variant ID (UUID).',
  })
  @ApiResponse({ status: 200, description: 'Variant deleted.' })
  @ApiResponse({ status: 404, description: 'Product or variant not found.' })
  deleteVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.service.deleteVariant(productId, variantId);
  }
}
