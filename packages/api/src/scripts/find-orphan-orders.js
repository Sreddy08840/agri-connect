const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    console.log('Finding orders whose farmerId does not exist in farmer_profiles...');
    const rows = await prisma.$queryRawUnsafe(`SELECT id, orderNumber, farmerId FROM orders WHERE farmerId NOT IN (SELECT id FROM farmer_profiles)`);
    console.log('Orphan orders count:', rows.length);
    rows.forEach(r => console.dir(r));
  } catch (e) {
    console.error('Error:', e.message || e);
    if (e.meta) console.error('meta:', e.meta);
  } finally {
    await prisma.$disconnect();
  }
})();
