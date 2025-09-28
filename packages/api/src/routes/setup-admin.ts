import { Router } from 'express';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

const router: Router = Router();

// Temporary endpoint to create admin user - REMOVE IN PRODUCTION
router.post('/create-admin', async (req, res) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not allowed in production' });
    }
    
    const adminPhone = '+919606860853';
    const adminPassword = 'Santosh@123';
    const adminName = 'Santosh Admin';
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { phone: adminPhone }
    });
    
    if (existingAdmin) {
      // Update existing admin password
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await prisma.user.update({
        where: { phone: adminPhone },
        data: { 
          passwordHash,
          role: 'ADMIN',
          name: adminName,
          verified: true
        }
      });
      
      return res.json({
        success: true,
        message: 'Admin user updated successfully',
        credentials: {
          phone: adminPhone,
          password: adminPassword,
          loginUrl: '/admin-login'
        }
      });
    } else {
      // Create new admin user
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      
      const admin = await prisma.user.create({
        data: {
          name: adminName,
          phone: adminPhone,
          passwordHash,
          role: 'ADMIN',
          verified: true
        }
      });
      
      return res.json({
        success: true,
        message: 'Admin user created successfully',
        admin: {
          id: admin.id,
          name: admin.name,
          phone: admin.phone,
          role: admin.role
        },
        credentials: {
          phone: adminPhone,
          password: adminPassword,
          loginUrl: '/admin-login'
        }
      });
    }
    
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

export default router;
