const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    console.log('Inspecting products createdAt/updatedAt types...');
    const rows = await p.$queryRawUnsafe(`SELECT id, typeof(createdAt) as createdType, hex(createdAt) as createdHex, typeof(updatedAt) as updatedType, hex(updatedAt) as updatedHex FROM products LIMIT 50`);
    console.log('Rows:', rows.length);
    rows.forEach(r => console.dir(r));
  } catch (e) {
    console.error('Error:', e.message || e);
    if (e.meta) console.error('meta:', e.meta);
  } finally {
    await p.$disconnect();
  }
})();
