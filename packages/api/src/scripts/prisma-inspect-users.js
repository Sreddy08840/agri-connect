const { PrismaClient } = require('@prisma/client');

(async () => {
  const p = new PrismaClient();
  try {
    console.log('Inspecting users table storage types and hex values...');
    const rows = await p.$queryRawUnsafe(`SELECT id, typeof(createdAt) as createdType, hex(createdAt) as createdHex, typeof(phone) as phoneType, hex(phone) as phoneHex, typeof(email) as emailType, hex(email) as emailHex FROM users LIMIT 50`);
    console.log('Rows:', rows.length);
    rows.forEach(r => console.dir(r));
  } catch (e) {
    console.error('Inspect users raw error:', e.message || e);
    if (e.meta) console.error('meta:', e.meta);
  } finally {
    await p.$disconnect();
  }
})();
