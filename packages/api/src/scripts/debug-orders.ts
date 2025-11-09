import { prisma } from '../config/database';

async function run() {
  console.log('Debugging prisma.order.findMany includes...');

  try {
    console.log('\n1) Basic findMany (no include)');
    const basic = await prisma.order.findMany({ take: 5 });
    console.log('Basic OK, rows:', basic.length);
  } catch (err: any) {
    console.error('Error on basic findMany:', err.message || err);
    if (err.code) console.error('Prisma error code:', err.code);
    process.exit(1);
  }

  try {
    console.log('\n2) Include customer');
    const withCustomer = await prisma.order.findMany({ take: 5, include: { customer: true } });
    console.log('Include customer OK, rows:', withCustomer.length);
  } catch (err: any) {
    console.error('Error when including customer:', err.message || err);
    if (err.code) console.error('Prisma error code:', err.code);
    process.exit(1);
  }

  try {
    console.log('\n3) Include farmer');
    const withFarmer = await prisma.order.findMany({ take: 5, include: { farmer: true } });
    console.log('Include farmer OK, rows:', withFarmer.length);
  } catch (err: any) {
    console.error('Error when including farmer:', err.message || err);
    if (err.code) console.error('Prisma error code:', err.code);
    process.exit(1);
  }

  try {
    console.log('\n4) Include items -> product select (id,name,images)');
    const withItems = await prisma.order.findMany({
      take: 5,
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, images: true } },
          },
        },
      },
    });

    console.log('Include items OK, rows:', withItems.length);
    // Print sample of product.images value for inspection
    for (const o of withItems) {
      for (const it of o.items) {
        console.log('product.images sample:', (it as any).product?.images);
      }
    }
  } catch (err: any) {
    console.error('Error when including items/product.images:', err.message || err);
    if (err.code) console.error('Prisma error code:', err.code);
    if (err.meta) console.error('Prisma meta:', err.meta);
    process.exit(1);
  }

  console.log('\nAll checks passed (no conversion error found by this script). If an include failed above, inspect the column types/data for that relation.');
  process.exit(0);
}

run().catch(e => {
  console.error('Unhandled error in debug script:', e);
  process.exit(1);
});
