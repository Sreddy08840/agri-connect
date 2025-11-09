const { PrismaClient } = require('@prisma/client');

(async () => {
  const p = new PrismaClient();
  try {
    const tests = [
      { select: { items: { select: { id: true } } }, name: 'items.id' },
      { select: { items: { select: { productId: true } } }, name: 'items.productId' },
      { select: { items: { select: { qty: true } } }, name: 'items.qty' },
      { select: { items: { select: { unitPrice: true } } }, name: 'items.unitPrice' },
    ];

    for (const t of tests) {
      try {
        console.log('Testing select:', t.name);
        const rows = await p.order.findMany({ take: 5, select: t.select });
        console.log(' OK:', t.name);
      } catch (e) {
        console.error(' FAIL:', t.name, e.message || e);
        if (e.meta) console.error('meta:', e.meta);
      }
    }
  } finally {
    await p.$disconnect();
  }
})();
