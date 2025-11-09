const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    console.log('Running prisma.user.findMany test...');
    const rows = await prisma.user.findMany({ take: 10, select: { id: true, name: true, phone: true, role: true, createdAt: true } });
    console.log('Rows fetched:', rows.length);
    console.dir(rows, { depth: 2 });
  } catch (err) {
    console.error('Prisma error:', err.message || err);
    if (err.code) console.error('Prisma code:', err.code);
    if (err.meta) console.error('Prisma meta:', err.meta);
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
})();
