const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const categories = [
  { name: 'Dairy Products', slug: 'dairy-products' },
  { name: 'Flowers & Plants', slug: 'flowers-plants' },
  { name: 'Fruits', slug: 'fruits' },
  { name: 'Grains & Cereals', slug: 'grains-cereals' },
  { name: 'Honey & Natural Products', slug: 'honey-natural-products' },
  { name: 'Nuts & Seeds', slug: 'nuts-seeds' },
  { name: 'Organic Products', slug: 'organic-products' },
  { name: 'Pulses & Legumes', slug: 'pulses-legumes' },
  { name: 'Spices & Herbs', slug: 'spices-herbs' },
  { name: 'Staples', slug: 'staples' },
  { name: 'Vegetables', slug: 'vegetables' },
];

async function seedCategories() {
  console.log('🌱 Seeding categories...');
  
  try {
    for (const category of categories) {
      try {
        // Use upsert to handle existing categories
        const result = await prisma.category.upsert({
          where: { slug: category.slug },
          update: { name: category.name }, // Update name if slug exists
          create: category // Create if doesn't exist
        });
        console.log(`✅ Ensured category exists: ${result.name}`);
      } catch (error) {
        console.log(`⚠️  Issue with category ${category.name}:`, error.message);
      }
    }
    
    console.log('🎉 Categories processing completed!');
    
    // Display all categories
    const allCategories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`\n📂 Total categories in database: ${allCategories.length}`);
    allCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories();
