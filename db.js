// db.js - Fixed version
console.log('📊 Initializing SQLite...');

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || '/tmp/osint.db';

// Try in-memory first (always works on Render)
let db;

try {
  // Try /tmp first
  if (fs.existsSync('/tmp')) {
    db = new sqlite3.Database(DB_PATH);
    console.log('✅ SQLite connected at:', DB_PATH);
  } else {
    throw new Error('/tmp not available');
  }
} catch (err) {
  console.log('⚠️ Using in-memory database');
  db = new sqlite3.Database(':memory:');
}

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT,
    input_param TEXT,
    input_value TEXT,
    response_status INTEGER,
    response_data TEXT,
    error_msg TEXT,
    ip_address TEXT,
    execution_time INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT UNIQUE,
    total_queries INTEGER DEFAULT 0,
    successful INTEGER DEFAULT 0,
    avg_time REAL DEFAULT 0
  )`, (err) => {
    if (err) console.error('❌ Table error:', err.message);
    else console.log('✅ Tables ready');
  });
});

module.exports = db;
