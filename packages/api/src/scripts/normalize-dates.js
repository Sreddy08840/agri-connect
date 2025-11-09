const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', '..', 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath);

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
}

async function normalize() {
  console.log('Normalizing createdAt/updatedAt fields where stored as integer (epoch ms) to ISO strings');

  try {
    // Show counts
    db.all("SELECT typeof(createdAt) as t, count(*) as c FROM users GROUP BY typeof(createdAt)", (e, rows) => console.log('users createdAt types:', rows));
    db.all("SELECT typeof(createdAt) as t, count(*) as c FROM orders GROUP BY typeof(createdAt)", (e, rows) => console.log('orders createdAt types:', rows));

    // Update users
    const uSql = `UPDATE users SET createdAt = strftime('%Y-%m-%dT%H:%M:%fZ', createdAt/1000.0, 'unixepoch') WHERE typeof(createdAt) = 'integer'`;
    const uChanges = await runSql(uSql);
    console.log('Updated users rows:', uChanges);

    const uUpdSql = `UPDATE users SET updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', updatedAt/1000.0, 'unixepoch') WHERE typeof(updatedAt) = 'integer'`;
    const uUpdChanges = await runSql(uUpdSql);
    console.log('Updated users updatedAt rows:', uUpdChanges);

    // Update orders
    const oSql = `UPDATE orders SET createdAt = strftime('%Y-%m-%dT%H:%M:%fZ', createdAt/1000.0, 'unixepoch') WHERE typeof(createdAt) = 'integer'`;
    const oChanges = await runSql(oSql);
    console.log('Updated orders rows:', oChanges);

    const oUpdSql = `UPDATE orders SET updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', updatedAt/1000.0, 'unixepoch') WHERE typeof(updatedAt) = 'integer'`;
    const oUpdChanges = await runSql(oUpdSql);
    console.log('Updated orders updatedAt rows:', oUpdChanges);

  // Normalize orders text timestamps that are missing timezone Z (append/convert to ISO Z)
  const oTextSql = `UPDATE orders SET createdAt = strftime('%Y-%m-%dT%H:%M:%fZ', datetime(createdAt)) WHERE typeof(createdAt) = 'text' AND createdAt NOT LIKE '%Z'`;
  const oTextChanges = await runSql(oTextSql);
  console.log('Normalized orders text createdAt rows:', oTextChanges);

  const oTextUpdSql = `UPDATE orders SET updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', datetime(updatedAt)) WHERE typeof(updatedAt) = 'text' AND updatedAt NOT LIKE '%Z'`;
  const oTextUpdChanges = await runSql(oTextUpdSql);
  console.log('Normalized orders text updatedAt rows:', oTextUpdChanges);

  // Handle numeric-string epoch-ms stored as TEXT (e.g. '1762620...') in users/orders
  const uTextEpochSql = `UPDATE users SET createdAt = strftime('%Y-%m-%dT%H:%M:%fZ', createdAt/1000.0, 'unixepoch') WHERE typeof(createdAt) = 'text' AND createdAt GLOB '[0-9]*' AND length(createdAt) >= 10`;
  const uTextEpochChanges = await runSql(uTextEpochSql);
  console.log('Converted users numeric-string createdAt rows:', uTextEpochChanges);

  const uTextEpochUpdSql = `UPDATE users SET updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', updatedAt/1000.0, 'unixepoch') WHERE typeof(updatedAt) = 'text' AND updatedAt GLOB '[0-9]*' AND length(updatedAt) >= 10`;
  const uTextEpochUpdChanges = await runSql(uTextEpochUpdSql);
  console.log('Converted users numeric-string updatedAt rows:', uTextEpochUpdChanges);

  const oTextEpochSql = `UPDATE orders SET createdAt = strftime('%Y-%m-%dT%H:%M:%fZ', createdAt/1000.0, 'unixepoch') WHERE typeof(createdAt) = 'text' AND createdAt GLOB '[0-9]*' AND length(createdAt) >= 10`;
  const oTextEpochChanges = await runSql(oTextEpochSql);
  console.log('Converted orders numeric-string createdAt rows:', oTextEpochChanges);

  const oTextEpochUpdSql = `UPDATE orders SET updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', updatedAt/1000.0, 'unixepoch') WHERE typeof(updatedAt) = 'text' AND updatedAt GLOB '[0-9]*' AND length(updatedAt) >= 10`;
  const oTextEpochUpdChanges = await runSql(oTextEpochUpdSql);
  console.log('Converted orders numeric-string updatedAt rows:', oTextEpochUpdChanges);

  // Normalize products createdAt/updatedAt stored as integer or numeric-string epoch-ms
  const pCreatedSql = `UPDATE products SET createdAt = strftime('%Y-%m-%dT%H:%M:%fZ', createdAt/1000.0, 'unixepoch') WHERE typeof(createdAt) = 'integer'`;
  const pCreatedChanges = await runSql(pCreatedSql);
  console.log('Converted products integer createdAt rows:', pCreatedChanges);

  const pUpdatedSql = `UPDATE products SET updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', updatedAt/1000.0, 'unixepoch') WHERE typeof(updatedAt) = 'integer'`;
  const pUpdatedChanges = await runSql(pUpdatedSql);
  console.log('Converted products integer updatedAt rows:', pUpdatedChanges);

  const pTextEpochSql = `UPDATE products SET createdAt = strftime('%Y-%m-%dT%H:%M:%fZ', createdAt/1000.0, 'unixepoch') WHERE typeof(createdAt) = 'text' AND createdAt GLOB '[0-9]*' AND length(createdAt) >= 10`;
  const pTextEpochChanges = await runSql(pTextEpochSql);
  console.log('Converted products numeric-string createdAt rows:', pTextEpochChanges);

  const pTextEpochUpdSql = `UPDATE products SET updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', updatedAt/1000.0, 'unixepoch') WHERE typeof(updatedAt) = 'text' AND updatedAt GLOB '[0-9]*' AND length(updatedAt) >= 10`;
  const pTextEpochUpdChanges = await runSql(pTextEpochUpdSql);
  console.log('Converted products numeric-string updatedAt rows:', pTextEpochUpdChanges);

    console.log('Normalization complete. You may want to run prisma tests again.');
  } catch (err) {
    console.error('Normalization failed:', err);
  } finally {
    db.close();
  }
}

normalize();
