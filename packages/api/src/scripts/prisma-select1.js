const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    const r = await p.$queryRawUnsafe('SELECT 1 as n');
    console.log('SELECT1 result:', r);
  } catch (e) {
    console.error('SELECT1 error:', e);
  } finally {
    await p.$disconnect();
  }
})();
