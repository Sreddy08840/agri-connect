const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupOrphanedProducts() {
  console.log('🔍 Starting cleanup of orphaned products...');
  
  try {
    // Find all products with their farmer information
    const products = await prisma.product.findMany({
      include: {
        farmer: {
          include: {
            farmerProfile: true
          }
        }
      }
    });

    console.log(`📊 Total products found: ${products.length}`);

    // Find orphaned products (farmer exists but no farmer profile)
    const orphanedProducts = products.filter(product => 
      product.farmer && product.farmer.role === 'FARMER' && !product.farmer.farmerProfile
    );

    console.log(`⚠️  Orphaned products found: ${orphanedProducts.length}`);

    if (orphanedProducts.length === 0) {
      console.log('✅ No orphaned products found. All products have valid farmer profiles.');
      return;
    }

    // Display orphaned products
    console.log('\n🔍 Orphaned products details:');
    orphanedProducts.forEach((product, index) => {
      console.log(`${index + 1}. Product: "${product.name}" (ID: ${product.id})`);
      console.log(`   Farmer: ${product.farmer.name || 'No name'} (ID: ${product.farmer.id})`);
      console.log(`   Phone: ${product.farmer.phone}`);
      console.log('');
    });

    // Option 1: Create farmer profiles for orphaned farmers
    console.log('🔧 Creating farmer profiles for orphaned farmers...');
    
    const uniqueFarmers = [...new Map(
      orphanedProducts.map(p => [p.farmer.id, p.farmer])
    ).values()];

    for (const farmer of uniqueFarmers) {
      const businessName = farmer.name ? `${farmer.name}'s Farm` : `Farm ${farmer.phone}`;
      
      console.log(`Creating farmer profile for: ${farmer.name || farmer.phone}`);
      
      await prisma.farmerProfile.create({
        data: {
          userId: farmer.id,
          businessName: businessName,
          description: 'Auto-generated farmer profile',
          isActive: true,
        }
      });
    }

    console.log('✅ Farmer profiles created successfully!');

    // Verify the fix
    const verifyProducts = await prisma.product.findMany({
      include: {
        farmer: {
          include: {
            farmerProfile: true
          }
        }
      }
    });

    const stillOrphaned = verifyProducts.filter(product => 
      product.farmer && product.farmer.role === 'FARMER' && !product.farmer.farmerProfile
    );

    console.log(`\n📊 Verification results:`);
    console.log(`✅ Total products: ${verifyProducts.length}`);
    console.log(`✅ Products with valid farmer profiles: ${verifyProducts.length - stillOrphaned.length}`);
    console.log(`❌ Still orphaned: ${stillOrphaned.length}`);

    if (stillOrphaned.length === 0) {
      console.log('\n🎉 SUCCESS: All products now have valid farmer profiles!');
    } else {
      console.log('\n⚠️  Some products are still orphaned. Manual intervention may be required.');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Alternative option: Remove orphaned products entirely
async function removeOrphanedProducts() {
  console.log('🗑️  Starting removal of orphaned products...');
  
  try {
    // Find orphaned products
    const products = await prisma.product.findMany({
      include: {
        farmer: {
          include: {
            farmerProfile: true
          }
        }
      }
    });

    const orphanedProducts = products.filter(product => 
      product.farmer && product.farmer.role === 'FARMER' && !product.farmer.farmerProfile
    );

    if (orphanedProducts.length === 0) {
      console.log('✅ No orphaned products to remove.');
      return;
    }

    console.log(`⚠️  Found ${orphanedProducts.length} orphaned products to remove:`);
    orphanedProducts.forEach((product, index) => {
      console.log(`${index + 1}. "${product.name}" by ${product.farmer.name || product.farmer.phone}`);
    });

    // Remove orphaned products
    const orphanedIds = orphanedProducts.map(p => p.id);
    
    const result = await prisma.product.deleteMany({
      where: {
        id: {
          in: orphanedIds
        }
      }
    });

    console.log(`✅ Removed ${result.count} orphaned products successfully!`);

  } catch (error) {
    console.error('❌ Error during removal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const action = args[0];

  if (action === 'remove') {
    await removeOrphanedProducts();
  } else {
    await cleanupOrphanedProducts();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { cleanupOrphanedProducts, removeOrphanedProducts };
