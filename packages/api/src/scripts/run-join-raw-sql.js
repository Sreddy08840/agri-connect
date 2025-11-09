const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '..', '..', 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath);
const orderId = process.argv[2] || '89671c9407d14c439731bb7be2d5edad';

db.serialize(() => {
  const sql = `SELECT o.id as oid, hex(o.addressSnapshot) as o_addr_hex, hex(o.deliverySlot) as o_delivery_hex, oi.id as oi_id, hex(oi.qty) as oi_qty_hex, oi.productId as oi_pid, p.id as pid, hex(p.name) as p_name_hex, hex(p.images) as p_images_hex, hex(p.description) as p_desc_hex FROM orders o LEFT JOIN order_items oi ON oi.orderId = o.id LEFT JOIN products p ON p.id = oi.productId WHERE o.id = ?`;
  db.all(sql, [orderId], (err, rows) => {
    if (err) { console.error('Select error:', err.message); db.close(); return; }
    console.log('Joined raw rows for order', orderId);
    rows.forEach(r => console.dir(r));
    db.close();
  });
});
