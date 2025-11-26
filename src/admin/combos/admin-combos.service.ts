import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { combo_pricing_type, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdminComboListQueryDto,
  AdminCreateComboDto,
  AdminUpdateComboDto,
} from './dto/admin-combo.dto';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';

@Injectable()
export class AdminCombosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async list(query: AdminComboListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.combosWhereInput | undefined = query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { slug: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const [total, data] = await Promise.all([
      this.prisma.combos.count({ where }),
      this.prisma.combos.findMany({
        where,
        include: this.comboInclude(),
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, data };
  }

  async getById(id: string) {
    const combo = await this.prisma.combos.findUnique({
      where: { id },
      include: this.comboInclude(),
    });
    if (!combo) {
      throw new NotFoundException('Combo not found');
    }
    return combo;
  }

  async create(dto: AdminCreateComboDto) {
    await this.ensureSlugUnique(dto.slug);
    await this.ensureVariantsExist(dto.components.map((c) => c.variantId));

    const combo = await this.prisma.combos.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        pricing_type: dto.pricingType,
        list_price_vnd: dto.listPriceVnd,
        amount_off_vnd: dto.amountOffVnd ?? 0,
        percent_off: dto.percentOff ?? 0,
        is_active: dto.isActive ?? true,
        price_version: this.generatePriceVersion(),
        components: {
          create: dto.components.map((component) => ({
            variant_id: component.variantId,
            quantity: component.quantity,
            unit_price_override_vnd: component.unitPriceOverrideVnd,
          })),
        },
      },
      include: this.comboInclude(),
    });
    return combo;
  }

  async update(id: string, dto: AdminUpdateComboDto) {
    const combo = await this.prisma.combos.findUnique({
      where: { id },
      include: { components: true },
    });
    if (!combo) {
      throw new NotFoundException('Combo not found');
    }

    if (dto.slug && dto.slug !== combo.slug) {
      await this.ensureSlugUnique(dto.slug);
    }

    if (dto.components) {
      await this.ensureVariantsExist(dto.components.map((c) => c.variantId));
    }

    const data: Prisma.combosUpdateInput = {};
    let bumpPriceVersion = false;

    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.slug !== undefined) {
      data.slug = dto.slug;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (
      dto.pricingType !== undefined &&
      dto.pricingType !== combo.pricing_type
    ) {
      data.pricing_type = dto.pricingType;
      bumpPriceVersion = true;
    }
    if (dto.listPriceVnd !== undefined) {
      data.list_price_vnd = dto.listPriceVnd;
      if (dto.listPriceVnd !== combo.list_price_vnd) {
        bumpPriceVersion = true;
      }
    }
    if (dto.amountOffVnd !== undefined) {
      data.amount_off_vnd = dto.amountOffVnd;
      if (dto.amountOffVnd !== combo.amount_off_vnd) {
        bumpPriceVersion = true;
      }
    }
    if (dto.percentOff !== undefined) {
      data.percent_off = dto.percentOff;
      if (dto.percentOff !== combo.percent_off) {
        bumpPriceVersion = true;
      }
    }
    if (dto.isActive !== undefined) {
      data.is_active = dto.isActive;
    }
    if (dto.components) {
      bumpPriceVersion = true;
    }
    if (bumpPriceVersion) {
      data.price_version = this.generatePriceVersion();
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.combos.update({
        where: { id },
        data,
      });

      if (dto.components) {
        await tx.combo_components.deleteMany({ where: { combo_id: id } });
        await Promise.all(
          dto.components.map((component) =>
            tx.combo_components.create({
              data: {
                combo_id: id,
                variant_id: component.variantId,
                quantity: component.quantity,
                unit_price_override_vnd: component.unitPriceOverrideVnd,
              },
            }),
          ),
        );
      }

      return tx.combos.findUnique({
        where: { id: updated.id },
        include: this.comboInclude(),
      });
    });

    return result;
  }

  async delete(id: string) {
    await this.ensureCombo(id);
    await this.prisma.combos.delete({ where: { id } });
    return { ok: true };
  }

  async uploadImage(comboId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const combo = await this.prisma.combos.findUnique({
      where: { id: comboId },
    });
    if (!combo) {
      throw new NotFoundException('Combo not found');
    }

    const { url } = await this.cloudinary.uploadImage(file, {
      folder: 'order-it-youth/combos',
    });

    return this.prisma.combos.update({
      where: { id: comboId },
      data: { cover_image_url: url },
    });
  }

  private comboInclude() {
    return {
      components: {
        include: {
          variant: {
            include: { product: true },
          },
        },
      },
    };
  }

  private async ensureCombo(id: string) {
    const combo = await this.prisma.combos.findUnique({ where: { id } });
    if (!combo) {
      throw new NotFoundException('Combo not found');
    }
    return combo;
  }

  private async ensureSlugUnique(slug: string) {
    const existed = await this.prisma.combos.findFirst({ where: { slug } });
    if (existed) {
      throw new ConflictException('Slug already exists');
    }
  }

  private async ensureVariantsExist(variantIds: string[]) {
    if (!variantIds.length) {
      return;
    }
    const found = await this.prisma.product_variants.findMany({
      where: { id: { in: variantIds } },
      select: { id: true },
    });
    const foundSet = new Set(found.map((item) => item.id));
    const missing = variantIds.filter((id) => !foundSet.has(id));
    if (missing.length) {
      throw new NotFoundException(
        `Variant(s) not found: ${missing.join(', ')}`,
      );
    }
  }

  private generatePriceVersion() {
    return BigInt(Date.now());
  }
}
