const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    const userId = 'cmhqe97yv00003o4bpwhqg9bn';
    const fp = await p.farmerProfile.findFirst({ where: { userId } });
    console.log('FarmerProfile for userId:', fp);
    const fpById = await p.farmerProfile.findUnique({ where: { id: userId } });
    console.log('FarmerProfile for id (userId used as id):', fpById);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await p.$disconnect();
  }
})();
