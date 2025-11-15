// SQLite connection setup (using sqlite3)
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '..', 'database', 'stream.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Could not open DB', err);
  else console.log('Connected to SQLite DB:', dbPath);
});

module.exports = db;
