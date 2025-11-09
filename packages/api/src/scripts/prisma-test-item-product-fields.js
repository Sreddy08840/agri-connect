const { PrismaClient } = require('@prisma/client');

(async () => {
  const p = new PrismaClient();
  try {
    const tests = [
      { select: { items: { include: { product: { select: { id: true } } } } }, name: 'product.id' },
      { select: { items: { include: { product: { select: { name: true } } } } }, name: 'product.name' },
      { select: { items: { include: { product: { select: { images: true } } } } }, name: 'product.images' },
      { select: { items: { include: { product: { select: { id: true, name: true } } } } }, name: 'product.id+name' },
      { select: { items: { include: { product: { select: { id: true, images: true } } } } }, name: 'product.id+images' },
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
