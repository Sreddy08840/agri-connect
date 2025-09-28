const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugLogin() {
  try {
    console.log('🔍 Debugging login for phone: +919902623950');
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { phone: '+919902623950' }
    });
    
    if (!user) {
      console.log('❌ User not found with phone +919902623950');
      
      // Check all users in database
      const allUsers = await prisma.user.findMany({
        select: { id: true, phone: true, name: true, role: true, passwordHash: true }
      });
      
      console.log('\n📋 All users in database:');
      allUsers.forEach(u => {
        console.log(`- ${u.name} (${u.phone}) - Role: ${u.role} - Has Password: ${!!u.passwordHash}`);
      });
      
      if (allUsers.length === 0) {
        console.log('\n💡 No users found. You need to register first!');
        console.log('Go to: http://localhost:5174/register');
      }
    } else {
      console.log('✅ User found:', {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        hasPassword: !!user.passwordHash
      });
      
      if (!user.passwordHash) {
        console.log('❌ User has no password set. They need to register with password.');
      } else {
        console.log('✅ User has password hash');
        
        // Test password (you'll need to replace 'yourpassword' with the actual password you're trying)
        const testPassword = 'password123'; // Replace with your actual password
        const isValid = await bcrypt.compare(testPassword, user.passwordHash);
        console.log(`🔑 Password test (${testPassword}):`, isValid ? '✅ Valid' : '❌ Invalid');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLogin();
