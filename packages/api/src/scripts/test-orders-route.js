const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const where = {};
    const page = 1, limit = 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            select: { id: true, orderId: true, productId: true, qty: true, unitPrice: true, createdAt: true },
          },
          customer: { select: { name: true, phone: true } },
          farmer: { select: { businessName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const productIds = Array.from(new Set(orders.flatMap(o => o.items.map(it => it.productId))));
    const products = productIds.length > 0 ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, images: true } }) : [];
    const productsMap = products.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});

    orders.forEach(order => {
      order.items = order.items.map(it => ({ ...it, product: productsMap[it.productId] || null }));
    });

    console.log('Fetched orders count:', orders.length, 'total:', total);
    console.dir(orders, { depth: 2 });
  } catch (e) {
    console.error('Error:', e.message || e);
    if (e.meta) console.error('meta:', e.meta);
  } finally {
    await prisma.$disconnect();
  }
})();
