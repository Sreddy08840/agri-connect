const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '..', '..', 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  const sql = `SELECT id, orderId, productId, createdAt, typeof(createdAt) as createdType, hex(createdAt) as createdHex FROM order_items LIMIT 200`;
  db.all(sql, (err, rows) => {
    if (err) { console.error('Select error:', err.message); db.close(); return; }
    console.log('order_items createdAt samples:');
    rows.forEach(r => console.dir(r));
    db.close();
  });
});
