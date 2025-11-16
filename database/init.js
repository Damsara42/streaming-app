const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Define file paths
const dbPath = path.resolve(__dirname, 'stream.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

// 1. Delete the old database file if it exists
// This ensures a clean start every time you run init
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Removed old database file.');
}

// 2. Read the schema.sql file
let schemaSql;
try {
    schemaSql = fs.readFileSync(schemaPath, 'utf8');
} catch (err) {
    console.error('Error reading schema.sql:', err.message);
    process.exit(1); // Exit with an error
}

// 3. Connect to the database (this will create the file)
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error('Error opening database:', err.message);
    }
    console.log('Connected to the SQLite database (file created).');
});

// 4. Execute the entire SQL schema script
db.exec(schemaSql, (err) => {
    if (err) {
        console.error('Error initializing database:', err.message);
    } else {
        console.log('\nDatabase initialized successfully.');
        console.log('Tables created and default data inserted.');
    }

    // 5. Close the database connection
    db.close((err) => {
        if (err) {
            return console.error('Error closing database:', err.message);
        }
        console.log('Database connection closed.');
    });
});