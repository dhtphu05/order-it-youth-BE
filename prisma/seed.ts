import { PrismaClient, user_role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding initial ADMIN user...');

  const existing = await prisma.users.findFirst({
    where: { role: user_role.ADMIN },
  });

  const passwordHash = await bcrypt.hash('admin123', 10);

  if (existing) {
    await prisma.users.update({
      where: { id: existing.id },
      data: {
        full_name: 'System Administrator',
        email: 'admin123@gmail.com',
        password_hash: passwordHash,
        role: user_role.ADMIN,
        phone: null,
        meta: {},
      },
    });

    console.log('♻️ Admin updated to:');
    console.log('   Email: admin123@gmail.com');
    console.log('   Password reset to: admin123');
    return;
  }

  const admin = await prisma.users.create({
    data: {
      full_name: 'System Administrator',
      email: 'admin123@gmail.com',
      password_hash: passwordHash,
      role: user_role.ADMIN,
      phone: null,
      meta: {},
    },
  });

  console.log('🎉 Admin created:');
  console.log(`   Email: ${admin.email}`);
  console.log('   Password: admin123');
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
