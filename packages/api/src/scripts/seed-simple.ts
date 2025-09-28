
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

  // Create sample products
  const products = [
    {
      name: 'Fresh Red Apples',
      description: 'Crisp and juicy red apples from our organic orchard',
      price: 120.00,
      unit: 'kg',
      minOrderQty: 1,
      categoryId: fruits.id,
      farmerId: farmer.id,
      status: 'APPROVED',
      images: 'https://example.com/apple1.jpg,https://example.com/apple2.jpg',
    },
    {
      name: 'Organic Tomatoes',
      description: 'Fresh organic tomatoes, perfect for cooking',
      price: 80.00,
      unit: 'kg',
      minOrderQty: 2,
      categoryId: vegetables.id,
      farmerId: farmer.id,
      status: 'APPROVED',
      images: 'https://example.com/tomato1.jpg',
    },
  ];

  for (const productData of products) {
    await prisma.product.upsert({
      where: { id: `product-${productData.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `product-${productData.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        unit: productData.unit,
        minOrderQty: productData.minOrderQty,
        categoryId: productData.categoryId,
        farmerId: farmer.id, // Use the actual farmer ID
        status: productData.status,
        images: productData.images,
      },
    });
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
