const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    const id = '89671c9407d14c439731bb7be2d5edad';
    console.log('Fetching order by id with items.product include:', id);
    const order = await p.order.findUnique({ where: { id }, include: { items: { include: { product: true } }, customer: true, farmer: true } });
    console.dir(order, { depth: 3 });
  } catch (e) {
    console.error('Error fetching order:', e.message || e);
    if (e.meta) console.error('meta:', e.meta);
  } finally {
    await p.$disconnect();
  }
})();
