/**
 * Backfill Events from existing Orders and Purchases
 * 
 * This script creates Event records from historical data to enable
 * ML recommendations based on past user behavior.
 * 
 * Usage: npm run backfill:events
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillEvents() {
  console.log('🔄 Starting event backfill...\n');
  console.log('=' .repeat(60));

  let totalCreated = 0;

  try {
    // Step 1: Backfill from Purchases table
    console.log('\n📦 Step 1: Processing purchases...');
    const purchases = await prisma.purchase.findMany({
      orderBy: { createdAt: 'asc' },
    });

    console.log(`   Found ${purchases.length} purchases to process`);

    for (const purchase of purchases) {
      // Check if event already exists
      const existingEvent = await prisma.event.findFirst({
        where: {
          userId: purchase.userId,
          productId: purchase.productId,
          type: 'purchase',
          createdAt: purchase.createdAt,
        },
      });

      if (!existingEvent) {
        await prisma.event.create({
          data: {
            userId: purchase.userId,
            productId: purchase.productId,
            type: 'purchase',
            value: purchase.quantity,
            createdAt: purchase.createdAt,
            meta: JSON.stringify({
              totalAmount: purchase.totalAmount,
              quantity: purchase.quantity,
              source: 'backfill_purchase',
            }),
          },
        });
        totalCreated++;
      }
    }

    console.log(`   ✅ Created ${totalCreated} purchase events`);

    // Step 2: Backfill from OrderItems (if orders exist)
    console.log('\n📋 Step 2: Processing order items...');
    const orderItems = await prisma.orderItem.findMany({
      include: {
        order: {
          select: {
            customerId: true,
            createdAt: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`   Found ${orderItems.length} order items to process`);

    let orderEventsCreated = 0;
    for (const item of orderItems) {
      // Only create events for completed/confirmed orders
      if (item.order.status === 'DELIVERED' || item.order.status === 'CONFIRMED') {
        // Check if event already exists
        const existingEvent = await prisma.event.findFirst({
          where: {
            userId: item.order.customerId,
            productId: item.productId,
            type: 'purchase',
            createdAt: item.order.createdAt,
          },
        });

        if (!existingEvent) {
          await prisma.event.create({
            data: {
              userId: item.order.customerId,
              productId: item.productId,
              type: 'purchase',
              value: item.qty,
              createdAt: item.order.createdAt,
              meta: JSON.stringify({
                totalAmount: item.unitPrice * item.qty,
                quantity: item.qty,
                orderId: item.orderId,
                source: 'backfill_order',
              }),
            },
          });
          orderEventsCreated++;
          totalCreated++;
        }
      }
    }

    console.log(`   ✅ Created ${orderEventsCreated} order events`);

    // Step 3: Create view events for products in cart (optional)
    console.log('\n🛒 Step 3: Processing cart items...');
    const cartItems = await prisma.cartItem.findMany({
      include: {
        cart: {
          select: {
            userId: true,
          },
        },
      },
    });

    console.log(`   Found ${cartItems.length} cart items to process`);

    let cartEventsCreated = 0;
    for (const item of cartItems) {
      // Check if view event already exists (within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const existingEvent = await prisma.event.findFirst({
        where: {
          userId: item.cart.userId,
          productId: item.productId,
          type: 'view',
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

      if (!existingEvent) {
        await prisma.event.create({
          data: {
            userId: item.cart.userId,
            productId: item.productId,
            type: 'view',
            createdAt: item.createdAt,
            meta: JSON.stringify({
              source: 'backfill_cart',
            }),
          },
        });
        cartEventsCreated++;
        totalCreated++;
      }
    }

    console.log(`   ✅ Created ${cartEventsCreated} view events from cart`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(`\n✨ Backfill complete!`);
    console.log(`   Total events created: ${totalCreated}`);
    console.log(`   - Purchase events: ${totalCreated - cartEventsCreated}`);
    console.log(`   - View events: ${cartEventsCreated}`);

    // Show event statistics
    const eventStats = await prisma.event.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    });

    console.log('\n📊 Current event statistics:');
    eventStats.forEach((stat) => {
      console.log(`   ${stat.type}: ${stat._count.id} events`);
    });

    console.log('\n💡 Next steps:');
    console.log('   1. Refresh ML index: curl -X POST http://localhost:8000/refresh');
    console.log('   2. Test recommendations: curl "http://localhost:8080/api/recommendations?userId=1&n=5"');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillEvents()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
