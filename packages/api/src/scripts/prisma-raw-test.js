const { PrismaClient } = require('@prisma/client');
const path = require('path');

async function run() {
  const prisma = new PrismaClient();
  try {
    console.log('Running prisma.order.findMany test...');
    const rows = await prisma.order.findMany({ take: 5 });
    console.log('Rows fetched:', rows.length);
    console.dir(rows, { depth: 2, maxArrayLength: 10 });
  } catch (err) {
    console.error('Prisma error:', err.message || err);
    if (err.code) console.error('Prisma code:', err.code);
    if (err.meta) console.error('Prisma meta:', err.meta);
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
