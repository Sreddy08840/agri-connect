const { PrismaClient } = require('@prisma/client');

(async () => {
  const p = new PrismaClient();
  const fields = ['id','name','phone','email','role','verified','createdAt','updatedAt','passwordHash','twoFactorSecret','backupCodes','avatarUrl','address'];
  try {
    for (const f of fields) {
      try {
        console.log(`Testing user field: ${f}`);
        const rows = await p.user.findMany({ take: 5, select: { [f]: true } });
        console.log(` OK: ${f}`);
      } catch (e) {
        console.error(` FAIL on field ${f}:`, e.message || e);
        if (e.meta) console.error('meta:', e.meta);
      }
    }
  } finally {
    await p.$disconnect();
  }
})();
