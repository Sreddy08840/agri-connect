const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    console.log('Testing items.createdAt select');
    try {
      const rows = await p.order.findMany({ take: 10, select: { items: { select: { createdAt: true } } } });
      console.log('OK rows:', rows.length);
      console.dir(rows, { depth: 3 });
    } catch (e) {
      console.error('FAIL items.createdAt:', e.message || e);
      if (e.meta) console.error('meta:', e.meta);
    }
  } finally {
    await p.$disconnect();
  }
})();
