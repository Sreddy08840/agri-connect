const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking admin users in database...\n');

db.all('SELECT id, name, phone, role, verified FROM users WHERE role = ?', ['ADMIN'], (err, rows) => {
  if (err) {
    console.error('❌ Error querying database:', err);
    return;
  }

  if (rows.length === 0) {
    console.log('⚠️ No admin users found in database');
  } else {
    console.log(`✅ Found ${rows.length} admin user(s):\n`);
    rows.forEach((user, index) => {
      console.log(`Admin ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Phone: ${user.phone}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Verified: ${user.verified ? 'Yes' : 'No'}`);
      console.log('');
    });
  }
  
  db.close();
});
