const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    console.log('Testing prisma.order.findMany selecting only id...');
    const rows = await p.order.findMany({ take: 10, select: { id: true } });
    console.log('Rows:', rows);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await p.$disconnect();
  }
})();
