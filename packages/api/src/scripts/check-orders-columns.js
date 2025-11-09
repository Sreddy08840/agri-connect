const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '..', '..', 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  const sql = `SELECT id, typeof(orderNumber) as t_orderNumber, typeof(customerId) as t_customerId, typeof(farmerId) as t_farmerId, typeof(total) as t_total, typeof(status) as t_status, typeof(paymentMethod) as t_paymentMethod, typeof(addressSnapshot) as t_addr, typeof(deliverySlot) as t_delivery, typeof(createdAt) as t_created, typeof(updatedAt) as t_updated FROM orders`;
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error querying orders types:', err.message);
      db.close();
      return;
    }

    const bad = rows.filter(r => r.t_total !== 'real' && r.t_total !== 'integer');
    console.log('Total rows:', rows.length, 'Rows with unexpected total type:', bad.length);
    if (bad.length > 0) console.table(bad.slice(0, 20));

    const addrBad = rows.filter(r => !['text','null'].includes(r.t_addr));
    console.log('Rows with unexpected addressSnapshot type:', addrBad.length);
    if (addrBad.length > 0) console.table(addrBad.slice(0, 20));

    db.close();
  });
});
