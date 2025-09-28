import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create categories
  const fruits = await prisma.category.upsert({
    where: { slug: 'fruits' },
    update: {},
    create: {
      name: 'Fruits',
      slug: 'fruits',
    },
  });

  const vegetables = await prisma.category.upsert({
    where: { slug: 'vegetables' },
    update: {},
    create: {
      name: 'Vegetables',
      slug: 'vegetables',
    },
  });

  const staples = await prisma.category.upsert({
    where: { slug: 'staples' },
    update: {},
    create: {
      name: 'Staples',
      slug: 'staples',
    },
  });

  // Create subcategories
  const apples = await prisma.category.upsert({
    where: { slug: 'apples' },
    update: {},
    create: {
      name: 'Apples',
      slug: 'apples',
      parentId: fruits.id,
    },
  });

  const tomatoes = await prisma.category.upsert({
    where: { slug: 'tomatoes' },
    update: {},
    create: {
      name: 'Tomatoes',
      slug: 'tomatoes',
      parentId: vegetables.id,
    },
  });

  const rice = await prisma.category.upsert({
    where: { slug: 'rice' },
    update: {},
    create: {
      name: 'Rice',
      slug: 'rice',
      parentId: staples.id,
    },
  });

  // Create admin user
  await prisma.user.upsert({
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

  // Create farmer profile
  await prisma.farmerProfile.upsert({
    where: { userId: farmer.id },
    update: {},
    create: {
      userId: farmer.id,
      businessName: 'Green Valley Farms',
      gstin: '29ABCDE1234F1Z5',
      deliveryZones: 'Local Area, Downtown, Suburbs',
      payoutAccount: '{"accountNumber":"1234567890","ifscCode":"SBIN0001234","bankName":"State Bank of India"}',
      ratingAvg: 4.5,
    },
  });

  // Create customer user
  await prisma.user.upsert({
    where: { phone: '+1122334455' },
    update: {},
    create: {
      phone: '+1122334455',
      name: 'Jane Customer',
      role: 'CUSTOMER',
      verified: true,
    },
  });

  // Create sample products
  const products = [
    {
      name: 'Fresh Red Apples',
      description: 'Crisp and juicy red apples from our organic orchard',
      price: 120.00,
      unit: 'kg',
      minOrderQty: 1,
      categoryId: apples.id,
      farmerId: farmer.id,
      status: 'APPROVED' as const,
      images: 'https://example.com/apple1.jpg,https://example.com/apple2.jpg',
    },
    {
      name: 'Organic Tomatoes',
      description: 'Fresh organic tomatoes, perfect for cooking',
      price: 80.00,
      unit: 'kg',
      minOrderQty: 2,
      categoryId: tomatoes.id,
      farmerId: farmer.id,
      status: 'APPROVED' as const,
      images: 'https://example.com/tomato1.jpg',
    },
    {
      name: 'Basmati Rice',
      description: 'Premium quality basmati rice, aged for perfect texture',
      price: 200.00,
      unit: 'kg',
      minOrderQty: 5,
      categoryId: rice.id,
      farmerId: farmer.id,
      status: 'APPROVED' as const,
      images: 'https://example.com/rice1.jpg',
    },
    {
      name: 'Green Apples',
      description: 'Tart green apples, great for baking',
      price: 100.00,
      unit: 'kg',
      minOrderQty: 1,
      categoryId: apples.id,
      farmerId: farmer.id,
      status: 'PENDING_REVIEW' as const,
      images: 'https://example.com/green-apple1.jpg',
    },
  ];

  for (const productData of products) {
    await prisma.product.upsert({
      where: { id: `product-${productData.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: productData,
    });
  }

  // Create sample vouchers
  const vouchers = [
    {
      code: 'WELCOME10',
      type: 'PERCENT' as const,
      value: 10.00,
      minCartTotal: 500.00,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isActive: true,
    },
    {
      code: 'SAVE50',
      type: 'FLAT' as const,
      value: 50.00,
      minCartTotal: 200.00,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      isActive: true,
    },
  ];

  for (const voucherData of vouchers) {
    await prisma.voucher.upsert({
      where: { code: voucherData.code },
      update: {},
      create: voucherData,
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user: +1234567890');
  console.log('👨‍🌾 Farmer user: +1987654321');
  console.log('🛒 Customer user: +1122334455');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
