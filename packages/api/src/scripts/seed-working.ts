import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database step by step...');

  // Step 1: Create categories first
  console.log('📁 Creating categories...');
  const fruits = await prisma.category.upsert({
    where: { slug: 'fruits' },
    update: {},
    create: {
      name: 'Fruits',
      slug: 'fruits',
      description: 'Fresh and organic fruits',
    },
  });

  const vegetables = await prisma.category.upsert({
    where: { slug: 'vegetables' },
    update: {},
    create: {
      name: 'Vegetables',
      slug: 'vegetables',
      description: 'Fresh vegetables from local farms',
    },
  });

  // Step 2: Create users
  console.log('👥 Creating users...');
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

  // Step 3: Create farmer profile
  console.log('👨‍🌾 Creating farmer profile...');
  const farmerProfile = await prisma.farmerProfile.upsert({
    where: { userId: farmer.id },
    update: {},
    create: {
      userId: farmer.id,
      businessName: 'Green Valley Farms',
      description: 'Organic farming since 1995',
      address: '123 Farm Road, Green Valley, State 12345',
      gstin: '29ABCDE1234F1Z5',
      deliveryZones: 'Local Area, Downtown, Suburbs',
      payoutAccount: '{"accountNumber":"1234567890","ifscCode":"SBIN0001234","bankName":"State Bank of India"}',
      ratingAvg: 4.5,
      totalSales: 150,
    },
  });

  // Step 4: Create products
  console.log('🍎 Creating products...');
  const apple = await prisma.product.upsert({
    where: { id: 'product-fresh-red-apples' },
    update: {},
    create: {
      id: 'product-fresh-red-apples',
      name: 'Fresh Red Apples',
      description: 'Crisp and juicy red apples from our organic orchard',
      price: 120.00,
      unit: 'kg',
      minOrderQty: 1,
      categoryId: fruits.id,
      farmerId: farmer.id,
      status: 'APPROVED',
      images: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
    },
  });

  const tomato = await prisma.product.upsert({
    where: { id: 'product-organic-tomatoes' },
    update: {},
    create: {
      id: 'product-organic-tomatoes',
      name: 'Organic Tomatoes',
      description: 'Fresh organic tomatoes, perfect for cooking',
      price: 80.00,
      unit: 'kg',
      minOrderQty: 2,
      categoryId: vegetables.id,
      farmerId: farmer.id,
      status: 'APPROVED',
      images: 'https://images.unsplash.com/photo-1546470427-5c1d2b2b2b2b?w=400',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('📊 Created:');
  console.log('  - 2 Categories (Fruits, Vegetables)');
  console.log('  - 3 Users (Admin, Farmer, Customer)');
  console.log('  - 1 Farmer Profile');
  console.log('  - 2 Products (Apples, Tomatoes)');
  console.log('');
  console.log('🔑 Demo Login Credentials:');
  console.log('  Admin: +1234567890 (any 6-digit OTP)');
  console.log('  Farmer: +1987654321 (any 6-digit OTP)');
  console.log('  Customer: +1122334455 (any 6-digit OTP)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
