const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    const base = { take: 5 };
    console.log('1) findMany basic');
    try { console.log(await p.order.findMany(base)); } catch (e) { console.error('err1', e.message); if (e.meta) console.error(e.meta); }

    console.log('\n2) findMany with orderBy createdAt desc');
    try { console.log(await p.order.findMany({ ...base, orderBy: { createdAt: 'desc' } })); } catch (e) { console.error('err2', e.message); if (e.meta) console.error(e.meta); }

    console.log('\n3) findMany include customer+farmer');
    try { console.log(await p.order.findMany({ ...base, include: { customer: { select: { name: true } }, farmer: { select: { businessName: true } } } })); } catch (e) { console.error('err3', e.message); if (e.meta) console.error(e.meta); }

    console.log('\n4) findMany include items select');
    try { console.log(await p.order.findMany({ ...base, include: { items: { select: { id: true, productId: true, qty: true } } } })); } catch (e) { console.error('err4', e.message); if (e.meta) console.error(e.meta); }

    console.log('\n5) findMany include items + customer + farmer');
    try { console.log(await p.order.findMany({ ...base, include: { items: { select: { id: true, productId: true, qty: true } }, customer: { select: { name: true } }, farmer: { select: { businessName: true } } } })); } catch (e) { console.error('err5', e.message); if (e.meta) console.error(e.meta); }

  } finally {
    await p.$disconnect();
  }
})();
