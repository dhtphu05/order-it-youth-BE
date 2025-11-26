import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdminCreateProductDto,
  AdminCreateVariantDto,
  AdminProductListQueryDto,
  AdminUpdateProductDto,
  AdminUpdateVariantDto,
} from './dto/admin-product.dto';

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminProductListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.productsWhereInput | undefined = query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { description: { contains: query.q, mode: 'insensitive' } },
            {
              variants: {
                some: { sku: { contains: query.q, mode: 'insensitive' } },
              },
            },
          ],
        }
      : undefined;

    const [total, data] = await Promise.all([
      this.prisma.products.count({ where }),
      this.prisma.products.findMany({
        where,
        include: { variants: { orderBy: { created_at: 'asc' } } },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, data };
  }

  async getById(id: string) {
    const product = await this.prisma.products.findUnique({
      where: { id },
      include: { variants: { orderBy: { created_at: 'asc' } } },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(dto: AdminCreateProductDto) {
    if (dto.variants?.length) {
      this.ensureUniqueSkus(dto.variants.map((variant) => variant.sku));
    }

    const product = await this.prisma.products.create({
      data: {
        name: dto.name,
        description: dto.description,
        is_donation_item: dto.isDonationItem ?? false,
        variants: dto.variants?.length
          ? {
              create: dto.variants.map((variant) =>
                this.buildVariantCreateInput(variant),
              ),
            }
          : undefined,
      },
      include: { variants: true },
    });
    return product;
  }

  async update(id: string, dto: AdminUpdateProductDto) {
    await this.ensureProduct(id);
    const data: Prisma.productsUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.isDonationItem !== undefined) {
      data.is_donation_item = dto.isDonationItem;
    }

    const product = await this.prisma.products.update({
      where: { id },
      data,
      include: { variants: true },
    });
    return product;
  }

  async delete(id: string) {
    await this.ensureProduct(id);
    await this.prisma.products.delete({ where: { id } });
    return { ok: true };
  }

  async createVariant(productId: string, dto: AdminCreateVariantDto) {
    await this.ensureProduct(productId);
    await this.ensureSkuNotTaken(productId, dto.sku);

    const variant = await this.prisma.product_variants.create({
      data: {
        product_id: productId,
        ...this.buildVariantCreateInput(dto),
      },
    });
    return variant;
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: AdminUpdateVariantDto,
  ) {
    const variant = await this.ensureVariant(productId, variantId);
    const data: Prisma.product_variantsUpdateInput = {};

    if (dto.sku && dto.sku !== variant.sku) {
      await this.ensureSkuNotTaken(productId, dto.sku);
      data.sku = dto.sku;
    }
    if (dto.option1 !== undefined) {
      data.option1 = dto.option1;
    }
    if (dto.option2 !== undefined) {
      data.option2 = dto.option2;
    }
    if (dto.stock !== undefined) {
      data.stock = dto.stock;
    }
    if (dto.priceVnd !== undefined) {
      if (dto.priceVnd < 0) {
        throw new BadRequestException('priceVnd must be >= 0');
      }
      if (dto.priceVnd !== variant.price_vnd) {
        data.price_vnd = dto.priceVnd;
        data.price_version = this.generatePriceVersion();
      }
    }

    const updated = await this.prisma.product_variants.update({
      where: { id: variantId },
      data,
    });
    return updated;
  }

  async deleteVariant(productId: string, variantId: string) {
    await this.ensureVariant(productId, variantId);
    await this.prisma.product_variants.delete({ where: { id: variantId } });
    return { ok: true };
  }

  private async ensureProduct(id: string) {
    const product = await this.prisma.products.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  private async ensureVariant(productId: string, variantId: string) {
    const variant = await this.prisma.product_variants.findFirst({
      where: { id: variantId, product_id: productId },
    });
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }
    return variant;
  }

  private ensureUniqueSkus(skus: string[]) {
    const unique = new Set(skus.map((sku) => sku.trim().toLowerCase()));
    if (unique.size !== skus.length) {
      throw new BadRequestException('Duplicate SKU detected in payload');
    }
  }

  private async ensureSkuNotTaken(productId: string, sku: string) {
    const existed = await this.prisma.product_variants.findFirst({
      where: { product_id: productId, sku },
    });
    if (existed) {
      throw new ConflictException('SKU already exists for this product');
    }
  }

  private buildVariantCreateInput(variant: AdminCreateVariantDto) {
    return {
      sku: variant.sku,
      option1: variant.option1,
      option2: variant.option2,
      price_vnd: variant.priceVnd,
      price_version: this.generatePriceVersion(),
      stock: variant.stock,
    };
  }

  private generatePriceVersion() {
    return BigInt(Date.now());
  }
}
