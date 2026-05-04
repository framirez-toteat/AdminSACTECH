const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'team.db'));

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  department TEXT,
  position TEXT,
  vacation_days_per_year INTEGER DEFAULT 15,
  balance_initial REAL DEFAULT 0,
  balance_date TEXT DEFAULT (date('now')),
  accrual_rate REAL DEFAULT 15,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// Migración: agregar columnas si no existen (DEFAULT debe ser constante en ALTER TABLE)
const cols = db.prepare("PRAGMA table_info(employees)").all().map(c => c.name);
if (!cols.includes('balance_initial')) db.exec("ALTER TABLE employees ADD COLUMN balance_initial REAL DEFAULT 0");
if (!cols.includes('balance_date'))    db.exec("ALTER TABLE employees ADD COLUMN balance_date TEXT DEFAULT '2026-01-01'");
if (!cols.includes('accrual_rate'))    db.exec("ALTER TABLE employees ADD COLUMN accrual_rate REAL DEFAULT 15");

db.exec(`CREATE TABLE IF NOT EXISTS vacations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  days_count INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`);

db.exec(`CREATE TABLE IF NOT EXISTS overtime (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  hours REAL NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
)`);

db.exec(`CREATE TABLE IF NOT EXISTS client_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  client_name TEXT,
  hours_outside REAL NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`);

module.exports = db;
