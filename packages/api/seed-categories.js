const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const agriculturalCategories = [
  {
    name: 'Vegetables',
    slug: 'vegetables',
    description: 'Fresh vegetables and leafy greens',
    image: '/categories/vegetables.jpg'
  },
  {
    name: 'Fruits',
    slug: 'fruits', 
    description: 'Fresh seasonal fruits',
    image: '/categories/fruits.jpg'
  },
  {
    name: 'Grains & Cereals',
    slug: 'grains-cereals',
    description: 'Rice, wheat, corn, and other grains',
    image: '/categories/grains.jpg'
  },
  {
    name: 'Pulses & Legumes',
    slug: 'pulses-legumes',
    description: 'Lentils, beans, chickpeas, and other pulses',
    image: '/categories/pulses.jpg'
  },
  {
    name: 'Spices & Herbs',
    slug: 'spices-herbs',
    description: 'Fresh and dried spices, herbs, and seasonings',
    image: '/categories/spices.jpg'
  },
  {
    name: 'Dairy Products',
    slug: 'dairy-products',
    description: 'Milk, cheese, yogurt, and other dairy items',
    image: '/categories/dairy.jpg'
  },
  {
    name: 'Nuts & Seeds',
    slug: 'nuts-seeds',
    description: 'Almonds, cashews, sunflower seeds, and more',
    image: '/categories/nuts.jpg'
  },
  {
    name: 'Organic Products',
    slug: 'organic-products',
    description: 'Certified organic produce and products',
    image: '/categories/organic.jpg'
  },
  {
    name: 'Flowers & Plants',
    slug: 'flowers-plants',
    description: 'Fresh flowers, plants, and saplings',
    image: '/categories/flowers.jpg'
  },
  {
    name: 'Honey & Natural Products',
    slug: 'honey-natural',
    description: 'Pure honey, jaggery, and natural products',
    image: '/categories/honey.jpg'
  }
];

async function seedCategories() {
  try {
    console.log('🌱 Seeding agricultural categories...');
    
    // Clear existing categories
    await prisma.category.deleteMany();
    console.log('🗑️ Cleared existing categories');
    
    // Add new categories
    for (const category of agriculturalCategories) {
      await prisma.category.create({
        data: category
      });
      console.log(`✅ Added category: ${category.name}`);
    }
    
    console.log('🎉 Successfully seeded all agricultural categories!');
    
    // Display all categories
    const categories = await prisma.category.findMany();
    console.log('\n📋 Available categories:');
    categories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.slug})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories();
