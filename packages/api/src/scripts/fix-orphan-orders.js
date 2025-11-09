const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    console.log('Finding orders with farmerId not present in farmer_profiles...');
    const orphans = await prisma.$queryRawUnsafe(`SELECT id, farmerId FROM orders WHERE farmerId NOT IN (SELECT id FROM farmer_profiles)`);
    console.log('Orphans found:', orphans.length);

    for (const o of orphans) {
      const currentFarmerId = o.farmerId;
      // See if there's a farmer_profile whose userId equals this farmerId (common mismatch)
      const profile = await prisma.farmerProfile.findFirst({ where: { userId: currentFarmerId } });
      if (profile) {
        console.log(`Updating order ${o.id}: set farmerId -> farmerProfile.id (${profile.id}) (was ${currentFarmerId})`);
        await prisma.order.update({ where: { id: o.id }, data: { farmerId: profile.id } });
      } else {
        console.warn(`No farmerProfile found for userId ${currentFarmerId}; skipping order ${o.id}`);
      }
    }

    console.log('Fixing complete. Re-run debug to confirm.');
  } catch (e) {
    console.error('Error during fix:', e.message || e);
    if (e.meta) console.error('meta:', e.meta);
  } finally {
    await prisma.$disconnect();
  }
})();
