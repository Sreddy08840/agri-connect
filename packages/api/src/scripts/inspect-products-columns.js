const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '..', '..', 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.all("PRAGMA table_info('products')", (err, cols) => {
    if (err) { console.error('PRAGMA error:', err.message); db.close(); return; }
    console.log('products table columns:');
    console.table(cols.map(c => ({ cid: c.cid, name: c.name, type: c.type, notnull: c.notnull, dflt_value: c.dflt_value, pk: c.pk })));
  });

  const sql = `SELECT id, typeof(price) as priceType, hex(price) as priceHex, typeof(images) as imgType, hex(images) as imgHex, typeof(embedding) as embType, hex(embedding) as embHex FROM products LIMIT 50`;
  db.all(sql, (err, rows) => {
    if (err) { console.error('Select error:', err.message); db.close(); return; }
    console.log('Sample product rows (hex shown for binary/text fields):');
    rows.forEach(r => console.dir(r));
    db.close();
  });
});
