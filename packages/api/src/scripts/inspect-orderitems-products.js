const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '..', '..', 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  const sql = `SELECT oi.id as oiId, oi.orderId, oi.productId, p.id as pid, p.name as pname, typeof(p.name) as nameType, hex(p.name) as nameHex, typeof(p.images) as imgType, hex(p.images) as imgHex, typeof(p.createdAt) as pCreatedType, hex(p.createdAt) as pCreatedHex FROM order_items oi LEFT JOIN products p ON oi.productId = p.id LIMIT 50`;
  db.all(sql, (err, rows) => {
    if (err) { console.error('Select error:', err.message); db.close(); return; }
    console.log('Sample joined rows:');
    rows.forEach(r => console.dir(r));
    db.close();
  });
});
