const { PrismaClient } = require('@prisma/client');

async function run() {
  const prisma = new PrismaClient();
  try {
    console.log('Running raw SQL via prisma.$queryRawUnsafe...');
    const rows = await prisma.$queryRawUnsafe(`SELECT id, orderNumber, customerId, farmerId, total, addressSnapshot, deliverySlot, createdAt, updatedAt FROM orders LIMIT 10`);
    console.log('Raw rows fetched:', rows.length);
    rows.forEach(r => console.dir(r, { depth: 1 }));
  } catch (err) {
    console.error('Raw SQL error:', err.message || err);
    if (err.code) console.error('Prisma code:', err.code);
    if (err.meta) console.error('Prisma meta:', err.meta);
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
