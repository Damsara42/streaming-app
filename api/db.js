const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Resolve the path to the database file in the /database directory
const dbPath = path.resolve(__dirname, '../database/stream.db');

// Create a new database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Enable foreign key support for SQLite
db.exec('PRAGMA foreign_keys = ON;', (err) => {
  if (err) {
    console.error("Could not enable foreign keys:", err.message);
  } else {
    console.log("Foreign keys enabled.");
  }
});

module.exports = db;