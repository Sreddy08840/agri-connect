import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with minimal data...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { phone: '+1234567890' },
    update: {},
    create: {
      phone: '+1234567890',
      name: 'Admin User',
      role: 'ADMIN',
      verified: true,
    },
  });

  // Create farmer user
  const farmer = await prisma.user.upsert({
    where: { phone: '+1987654321' },
    update: {},
    create: {
      phone: '+1987654321',
      name: 'John Farmer',
      role: 'FARMER',
      verified: true,
    },
  });

  // Create customer user
  const customer = await prisma.user.upsert({
    where: { phone: '+1122334455' },
    update: {},
    create: {
      phone: '+1122334455',
      name: 'Jane Customer',
      role: 'CUSTOMER',
      verified: true,
    },
  });

  console.log('✅ Users created successfully!');
  console.log('👤 Admin:', admin.phone, admin.name);
  console.log('👨‍🌾 Farmer:', farmer.phone, farmer.name);
  console.log('🛒 Customer:', customer.phone, customer.name);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
