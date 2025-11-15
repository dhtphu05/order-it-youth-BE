import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ComboResponseDto,
  ProductResponseDto,
} from './dto/product-response.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(): Promise<ProductResponseDto[]> {
    const products = await this.prisma.products.findMany({
      include: { variants: true },
      orderBy: { name: 'asc' },
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      is_donation_item: product.is_donation_item,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        option1: variant.option1,
        option2: variant.option2,
        price_vnd: variant.price_vnd,
        price_version: Number(variant.price_version),
        stock: variant.stock,
      })),
    }));
  }

  async listActiveCombos(): Promise<ComboResponseDto[]> {
    const combos = await this.prisma.combos.findMany({
      where: { is_active: true },
      include: { components: { include: { variant: true } } },
      orderBy: { name: 'asc' },
    });

    return combos.map((combo) => ({
      id: combo.id,
      name: combo.name,
      slug: combo.slug,
      pricing_type: combo.pricing_type,
      list_price_vnd: combo.list_price_vnd,
      amount_off_vnd: combo.amount_off_vnd,
      percent_off: combo.percent_off,
      price_version: Number(combo.price_version),
      components: combo.components.map((component) => ({
        quantity: component.quantity,
        variant: {
          id: component.variant.id,
          sku: component.variant.sku,
          option1: component.variant.option1,
          option2: component.variant.option2,
          price_vnd: component.variant.price_vnd,
          price_version: Number(component.variant.price_version),
        },
      })),
    }));
  }
}
