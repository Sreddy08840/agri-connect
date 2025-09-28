import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user...');
    
    const adminPhone = '+919606860853';
    const adminPassword = 'Santosh@123';
    const adminName = 'Santosh Admin';
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { phone: adminPhone }
    });
    
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists. Updating password...');
      
      // Update existing admin password
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await prisma.user.update({
        where: { phone: adminPhone },
        data: { 
          passwordHash,
          role: 'ADMIN',
          name: adminName,
          isVerified: true
        }
      });
      
      console.log('✅ Admin password updated successfully!');
    } else {
      // Create new admin user
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      
      const admin = await prisma.user.create({
        data: {
          name: adminName,
          phone: adminPhone,
          passwordHash,
          role: 'ADMIN',
          isVerified: true
        }
      });
      
      console.log('✅ Admin user created successfully!');
      console.log('Admin Details:', {
        id: admin.id,
        name: admin.name,
        phone: admin.phone,
        role: admin.role
      });
    }
    
    console.log('\n🎯 Admin Login Credentials:');
    console.log('Phone: +919606860853');
    console.log('Password: Santosh@123');
    console.log('URL: http://localhost:5174/admin-login');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
