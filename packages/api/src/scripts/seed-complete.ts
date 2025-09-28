import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with complete data...');

  // Create categories
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

  const staples = await prisma.category.upsert({
    where: { slug: 'staples' },
    update: {},
    create: {
      name: 'Staples',
      slug: 'staples',
      description: 'Rice, wheat, and other staples',
    },
  });

  // Create subcategories
  const apples = await prisma.category.upsert({
    where: { slug: 'apples' },
    update: {},
    create: {
      name: 'Apples',
      slug: 'apples',
      description: 'Fresh apples',
      parentId: fruits.id,
    },
  });

  const tomatoes = await prisma.category.upsert({
    where: { slug: 'tomatoes' },
    update: {},
    create: {
      name: 'Tomatoes',
      slug: 'tomatoes',
      description: 'Fresh tomatoes',
      parentId: vegetables.id,
    },
  });

  const rice = await prisma.category.upsert({
    where: { slug: 'rice' },
    update: {},
    create: {
      name: 'Rice',
      slug: 'rice',
      description: 'Premium quality rice',
      parentId: staples.id,
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
      description: 'Organic farming since 1995',
      address: '123 Farm Road, Green Valley, State 12345',
      gstin: '29ABCDE1234F1Z5',
      deliveryZones: 'Local Area, Downtown, Suburbs',
      payoutAccount: '{"accountNumber":"1234567890","ifscCode":"SBIN0001234","bankName":"State Bank of India"}',
      ratingAvg: 4.5,
      totalSales: 150,
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
      address: '456 Customer Street, City, State 54321',
    },
  });

  // Create sample products
  const products = [
    {
      name: 'Fresh Red Apples',
      description: 'Crisp and juicy red apples from our organic orchard. Perfect for snacking or baking.',
      price: 120.00,
      unit: 'kg',
      minOrderQty: 1,
      categoryId: apples.id,
      status: 'APPROVED',
      images: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400,https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400',
    },
    {
      name: 'Organic Tomatoes',
      description: 'Fresh organic tomatoes, perfect for cooking, salads, and sauces.',
      price: 80.00,
      unit: 'kg',
      minOrderQty: 2,
      categoryId: tomatoes.id,
      status: 'APPROVED',
      images: 'https://images.unsplash.com/photo-1546470427-5c1d2b2b2b2b?w=400',
    },
    {
      name: 'Basmati Rice',
      description: 'Premium quality basmati rice, aged for perfect texture and aroma.',
      price: 200.00,
      unit: 'kg',
      minOrderQty: 5,
      categoryId: rice.id,
      status: 'APPROVED',
      images: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
    },
    {
      name: 'Green Apples',
      description: 'Tart green apples, great for baking and making pies.',
      price: 100.00,
      unit: 'kg',
      minOrderQty: 1,
      categoryId: apples.id,
      status: 'APPROVED',
      images: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
    },
    {
      name: 'Cherry Tomatoes',
      description: 'Sweet cherry tomatoes, perfect for salads and snacking.',
      price: 150.00,
      unit: 'kg',
      minOrderQty: 1,
      categoryId: tomatoes.id,
      status: 'APPROVED',
      images: 'https://images.unsplash.com/photo-1546470427-5c1d2b2b2b2b?w=400',
    },
    {
      name: 'Brown Rice',
      description: 'Healthy brown rice with all natural nutrients intact.',
      price: 180.00,
      unit: 'kg',
      minOrderQty: 3,
      categoryId: rice.id,
      status: 'APPROVED',
      images: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
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
        farmerId: farmer.id,
        status: productData.status,
        images: productData.images,
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('📊 Created:');
  console.log('  - 3 Categories (Fruits, Vegetables, Staples)');
  console.log('  - 3 Subcategories (Apples, Tomatoes, Rice)');
  console.log('  - 3 Users (Admin, Farmer, Customer)');
  console.log('  - 1 Farmer Profile');
  console.log('  - 6 Products');
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
