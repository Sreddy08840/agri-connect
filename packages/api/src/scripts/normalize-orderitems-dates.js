const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '..', '..', 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath);

function toIsoZ(s) {
  // Parse into JS Date then return toISOString() which has Z and milliseconds
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

db.serialize(() => {
  const q = `SELECT id, createdAt, typeof(createdAt) as ctype FROM order_items`;
  db.all(q, (err, rows) => {
    if (err) { console.error('Select error:', err.message); db.close(); return; }
    let updated = 0;
    const updates = [];
    rows.forEach(r => {
      const cu = r.createdAt;
      let newCreated = null;
      if (r.ctype === 'text' && cu && !cu.endsWith('Z')) {
        const iso = toIsoZ(cu);
        if (iso) newCreated = iso;
      }
      if (newCreated) updates.push({ id: r.id, newCreated });
    });

    if (updates.length === 0) {
      console.log('No order_items date rows to normalize');
      db.close();
      return;
    }

    const stmt = db.prepare(`UPDATE order_items SET createdAt = COALESCE(?, createdAt) WHERE id = ?`);
    updates.forEach(u => {
      stmt.run(u.newCreated, u.id, function (err) {
        if (err) console.error('Update error for', u.id, err.message);
      });
      updated++;
    });
    stmt.finalize(() => {
      console.log('Normalized order_items rows:', updated);
      db.close();
    });
  });
});
