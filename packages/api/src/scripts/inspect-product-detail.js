const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '..', '..', 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath);
const pid = process.argv[2] || 'cmhqefmzh0001q6s39b8rj5ou';

db.serialize(() => {
  const sql = `SELECT id, typeof(name) as nameType, hex(name) as nameHex, typeof(description) as descType, hex(description) as descHex, typeof(unit) as unitType, hex(unit) as unitHex, typeof(price) as priceType, hex(price) as priceHex, typeof(images) as imgType, hex(images) as imgHex, typeof(embedding) as embType, hex(embedding) as embHex, typeof(createdAt) as createdType, hex(createdAt) as createdHex, typeof(updatedAt) as updatedType, hex(updatedAt) as updatedHex, farmerId, categoryId FROM products WHERE id = ?`;
  db.get(sql, [pid], (err, row) => {
    if (err) { console.error('Select error:', err.message); db.close(); return; }
    console.log('Product detail for', pid);
    console.dir(row);
    db.close();
  });
});
