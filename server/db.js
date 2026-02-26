import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcryptjs from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'inventario.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS accessories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS usage_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    accessory_id INTEGER NOT NULL REFERENCES accessories(id),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: add quantity column if missing
const cols = db.prepare("PRAGMA table_info(usage_records)").all();
if (!cols.find(c => c.name === 'quantity')) {
  db.exec("ALTER TABLE usage_records ADD COLUMN quantity INTEGER DEFAULT 1");
}
if (!cols.find(c => c.name === 'flagged')) {
  db.exec("ALTER TABLE usage_records ADD COLUMN flagged INTEGER DEFAULT 0");
}
if (!cols.find(c => c.name === 'user_id')) {
  db.exec("ALTER TABLE usage_records ADD COLUMN user_id INTEGER REFERENCES users(id)");
}

// Seed default admin user if no users exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const hashed = bcryptjs.hashSync('5303', 10);
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('Admin', hashed, 'admin');
}

export default db;
