const { PrismaClient } = require('@prisma/client');

(async () => {
  const p = new PrismaClient();
  const fields = ['orderNumber','customerId','farmerId','total','status','paymentMethod','addressSnapshot','deliverySlot','createdAt','updatedAt'];
  try {
    for (const f of fields) {
      try {
        console.log(`Testing field: ${f}`);
        const rows = await p.order.findMany({ take: 5, select: { [f]: true } });
        console.log(` OK: ${f}`);
      } catch (e) {
        console.error(` FAIL on field ${f}:`, e.message || e);
        if (e.meta) console.error('meta:', e.meta);
      }
    }
  } finally {
    await p.$disconnect();
  }
})();
