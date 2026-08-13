// db.js - SQLite with /tmp
console.log('📊 Initializing SQLite database in /tmp...');

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const DB_PATH = '/tmp/osint.db';
console.log('📁 Database path:', DB_PATH);

// Ensure /tmp is writable
try {
  if (!fs.existsSync('/tmp')) {
    fs.mkdirSync('/tmp', { recursive: true });
  }
  fs.writeFileSync('/tmp/test.txt', 'test');
  fs.unlinkSync('/tmp/test.txt');
  console.log('✅ /tmp is writable');
} catch (err) {
  console.error('❌ /tmp permission error:', err.message);
  console.log('⚠️ Falling back to in-memory database');
  const db = new sqlite3.Database(':memory:');
  createTables(db);
  module.exports = db;
  return;
}

// Open database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('✗ SQLite failed:', err);
    console.log('⚠️ Falling back to in-memory database');
    const memDb = new sqlite3.Database(':memory:');
    createTables(memDb);
    module.exports = memDb;
  } else {
    console.log('✓ SQLite connected at:', DB_PATH);
    createTables(db);
    module.exports = db;
  }
});

function createTables(database) {
  database.serialize(() => {
    database.run(`CREATE TABLE IF NOT EXISTS queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL,
      input_param TEXT,
      input_value TEXT,
      response_status INTEGER,
      response_data LONGTEXT,
      error_msg TEXT,
      ip_address TEXT,
      execution_time INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    database.run(`CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT UNIQUE,
      total_queries INTEGER DEFAULT 0,
      successful INTEGER DEFAULT 0,
      avg_time FLOAT DEFAULT 0
    )`);
  });
}
