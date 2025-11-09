const { PrismaClient } = require('@prisma/client');

(async () => {
  const p = new PrismaClient();
  try {
    console.log('Inspecting column storage types via raw SQL...');
    const rows = await p.$queryRawUnsafe(`SELECT id, typeof(total) as totalType, typeof(addressSnapshot) as addrType, typeof(createdAt) as createdType, hex(addressSnapshot) as addrHex, hex(createdAt) as createdHex FROM orders LIMIT 50`);
    console.log('Rows:', rows.length);
    rows.forEach(r => console.dir(r));
  } catch (e) {
    console.error('Inspect raw error:', e);
    if (e.meta) console.error('meta:', e.meta);
  } finally {
    await p.$disconnect();
  }
})();
