import { PrismaClient, combo_pricing_type } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.info('🧹 Clearing existing catalog data...');
  await prisma.order_items.deleteMany();
  await prisma.orders.deleteMany();
  await prisma.cart_items.deleteMany();
  await prisma.combo_components.deleteMany();
  await prisma.combos.deleteMany();
  await prisma.product_variants.deleteMany();
  await prisma.products.deleteMany();

  console.info('🧵 Creating products & variants...');
  const tshirt = await prisma.products.create({
    data: {
      name: 'Áo thun xanh',
      description: 'Áo thun cotton 2 chiều, màu xanh lá.',
      variants: {
        create: [
          {
            sku: 'TSHIRT-GREEN-M',
            option1: 'M',
            price_vnd: 120_000,
            stock: 30,
          },
          {
            sku: 'TSHIRT-GREEN-L',
            option1: 'L',
            price_vnd: 120_000,
            stock: 20,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const hoodie = await prisma.products.create({
    data: {
      name: 'Hoodie Youth',
      description: 'Hoodie nỉ in logo OrderItYouth.',
      variants: {
        create: [
          {
            sku: 'HOODIE-BLACK-M',
            option1: 'M',
            price_vnd: 320_000,
            stock: 15,
          },
          {
            sku: 'HOODIE-BLACK-L',
            option1: 'L',
            price_vnd: 320_000,
            stock: 10,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const cap = await prisma.products.create({
    data: {
      name: 'Nón Cap Youth',
      description: 'Nón lưỡi trai logo Youth, size free.',
      variants: {
        create: [
          {
            sku: 'CAP-GREEN-ONE',
            option1: 'One size',
            price_vnd: 80_000,
            stock: 40,
          },
        ],
      },
    },
    include: { variants: true },
  });

  console.info('🎁 Creating combos...');
  await prisma.combos.create({
    data: {
      name: 'Combo áo + nón',
      slug: 'combo-ao-non',
      pricing_type: combo_pricing_type.SUM_MINUS_AMOUNT,
      list_price_vnd: 200_000,
      amount_off_vnd: 20_000,
      percent_off: 0,
      components: {
        create: [
          {
            variant_id: tshirt.variants.find((v) => v.sku === 'TSHIRT-GREEN-M')!.id,
            quantity: 1,
          },
          {
            variant_id: cap.variants[0].id,
            quantity: 1,
          },
        ],
      },
    },
  });

  await prisma.combos.create({
    data: {
      name: 'Combo hoodie đôi',
      slug: 'combo-hoodie-doi',
      pricing_type: combo_pricing_type.SUM_MINUS_PERCENT,
      list_price_vnd: 640_000,
      percent_off: 10,
      components: {
        create: [
          {
            variant_id: hoodie.variants.find((v) => v.sku === 'HOODIE-BLACK-M')!.id,
            quantity: 1,
          },
          {
            variant_id: hoodie.variants.find((v) => v.sku === 'HOODIE-BLACK-L')!.id,
            quantity: 1,
          },
        ],
      },
    },
  });

  console.info('✅ Seed completed. Ready for testing!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
