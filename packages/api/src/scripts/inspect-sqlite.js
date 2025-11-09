const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'prisma', 'dev.db');

function runWithSqlite3() {
  try {
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('Failed to open DB with sqlite3:', err.message);
        process.exit(1);
      }
    });

    console.log('Opened DB:', dbPath);

    db.serialize(() => {
      db.all("PRAGMA table_info('orders')", (err, cols) => {
        if (err) {
          console.error('PRAGMA error:', err.message);
        } else {
          console.log('orders table columns:');
          console.table(cols.map(c => ({ cid: c.cid, name: c.name, type: c.type, notnull: c.notnull, dflt_value: c.dflt_value, pk: c.pk })));
        }
      });

      const sql = `SELECT id, orderNumber, customerId, farmerId, total, typeof(total) as totalType, hex(total) as totalHex, hex(addressSnapshot) as addrHex, hex(deliverySlot) as deliveryHex, hex(createdAt) as createdHex, hex(updatedAt) as updatedHex FROM orders LIMIT 50`;
      db.all(sql, (err, rows) => {
        if (err) {
          console.error('Select error:', err.message);
        } else {
          console.log('Sample rows (hex fields shown):');
          rows.forEach(r => console.log(r));
        }
        db.close();
      });
    });
  } catch (e) {
    console.error('sqlite3 module not available or failed to load:', e.message || e);
    return false;
  }
  return true;
}

function run() {
  if (!runWithSqlite3()) {
    console.error('Please install sqlite3 in this package (pnpm install --workspace-root sqlite3 or cd packages/api && pnpm install) and re-run this script.');
    process.exit(1);
  }
}

run();
