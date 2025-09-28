import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Create a test user with password
    const testPhone = '+919618068929';
    const testPassword = 'Test123!';
    const passwordHash = await bcrypt.hash(testPassword, 10);

    // Delete existing user if exists
    await prisma.user.deleteMany({
      where: { phone: testPhone }
    });

    // Create new test user
    const user = await prisma.user.create({
      data: {
        phone: testPhone,
        name: 'Test User',
        passwordHash,
        role: 'CUSTOMER',
        verified: true,
      },
    });

    console.log('✅ Test user created successfully:');
    console.log(`📱 Phone: ${testPhone}`);
    console.log(`🔐 Password: ${testPassword}`);
    console.log(`👤 User ID: ${user.id}`);
    console.log(`📧 Name: ${user.name}`);
    console.log(`🎭 Role: ${user.role}`);

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
