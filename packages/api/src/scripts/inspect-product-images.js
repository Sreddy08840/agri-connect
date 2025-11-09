const { PrismaClient } = require('@prisma/client');

(async () => {
  const p = new PrismaClient();
  try {
    console.log('Inspecting products.images storage types and hex values...');
    const rows = await p.$queryRawUnsafe(`SELECT id, typeof(images) as imgType, hex(images) as imgHex FROM products WHERE images IS NOT NULL LIMIT 50`);
    console.log('Rows:', rows.length);
    rows.forEach(r => console.dir(r));
  } catch (e) {
    console.error('Inspect products error:', e.message || e);
    if (e.meta) console.error('meta:', e.meta);
  } finally {
    await p.$disconnect();
  }
})();
