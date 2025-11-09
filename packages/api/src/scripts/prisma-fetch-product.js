const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    const prod = await p.product.findUnique({ where: { id: 'cmhqefmzh0001q6s39b8rj5ou' } });
    console.log('Product fetched via Prisma:');
    console.dir(prod);
  } catch (e) {
    console.error('Error fetching product:', e.message || e);
    if (e.meta) console.error('meta:', e.meta);
  } finally {
    await p.$disconnect();
  }
})();
