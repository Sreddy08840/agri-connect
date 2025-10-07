const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user directly in SQLite...');
    
    const dbPath = path.join(__dirname, 'prisma', 'dev.db');
    const db = new sqlite3.Database(dbPath);
    
    const adminPhone = '+918618808929';
    const adminPassword = 'Santosh@1234';
    const adminName = 'Santosh Admin';
    
    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    // Check if admin exists
    db.get('SELECT * FROM User WHERE phone = ?', [adminPhone], (err, row) => {
      if (err) {
        console.error('❌ Error checking admin:', err);
        return;
      }
      
      if (row) {
        console.log('⚠️ Admin user already exists. Updating...');
        
        // Update existing admin
        db.run(
          'UPDATE User SET passwordHash = ?, role = ?, name = ? WHERE phone = ?',
          [passwordHash, 'ADMIN', adminName, adminPhone],
          function(err) {
            if (err) {
              console.error('❌ Error updating admin:', err);
            } else {
              console.log('✅ Admin user updated successfully!');
              console.log('\n🎯 Admin Login Credentials:');
              console.log('Phone: +918618808929');
              console.log('Password: Santosh@1234');
              console.log('URL: http://localhost:5174/admin-login');
            }
            db.close();
          }
        );
      } else {
        console.log('📝 Creating new admin user...');
        
        // Generate a unique ID (simple timestamp-based)
        const adminId = 'admin_' + Date.now();
        
        // Create new admin
        db.run(
          'INSERT INTO User (id, name, phone, passwordHash, role, verified, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            adminId,
            adminName,
            adminPhone,
            passwordHash,
            'ADMIN',
            1, // verified = true
            new Date().toISOString(),
            new Date().toISOString()
          ],
          function(err) {
            if (err) {
              console.error('❌ Error creating admin:', err);
            } else {
              console.log('✅ Admin user created successfully!');
              console.log('Admin ID:', adminId);
              console.log('\n🎯 Admin Login Credentials:');
              console.log('Phone: +918618808929');
              console.log('Password: Santosh@1234');
              console.log('URL: http://localhost:5174/admin-login');
            }
            db.close();
          }
        );
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createAdmin();
