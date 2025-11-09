const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    console.log('Finding order_items whose productId does not exist in products...');
    const rows = await p.$queryRawUnsafe(`SELECT id, orderId, productId FROM order_items WHERE productId NOT IN (SELECT id FROM products)`);
    console.log('Orphan order_items count:', rows.length);
    rows.forEach(r => console.dir(r));
  } catch (e) {
    console.error('Error:', e.message || e);
    if (e.meta) console.error('meta:', e.meta);
  } finally {
    await p.$disconnect();
  }
})();
