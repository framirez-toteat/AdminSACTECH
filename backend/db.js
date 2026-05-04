const { Pool } = require('pg');

// Parseo manual para tolerar contraseñas con caracteres especiales (@, #, etc.)
function parseDbUrl(url) {
  const withoutProto = url.replace(/^\w+:\/\//, '');
  const lastAt = withoutProto.lastIndexOf('@');
  const userInfo = withoutProto.slice(0, lastAt);
  const hostInfo = withoutProto.slice(lastAt + 1);
  const colonIdx = userInfo.indexOf(':');
  const user = userInfo.slice(0, colonIdx);
  const password = userInfo.slice(colonIdx + 1);
  const slashIdx = hostInfo.indexOf('/');
  const hostPort = hostInfo.slice(0, slashIdx);
  const database = hostInfo.slice(slashIdx + 1).split('?')[0];
  const [host, port] = hostPort.split(':');
  return { user, password, host, port: parseInt(port) || 5432, database };
}

const dbConfig = process.env.DATABASE_URL
  ? { ...parseDbUrl(process.env.DATABASE_URL), ssl: { rejectUnauthorized: false } }
  : {};

const pool = new Pool(dbConfig);

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      department TEXT,
      position TEXT,
      vacation_days_per_year INTEGER DEFAULT 15,
      balance_initial REAL DEFAULT 0,
      balance_date DATE DEFAULT CURRENT_DATE,
      accrual_rate REAL DEFAULT 15,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vacations (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      days_count INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS overtime (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      hours REAL NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_visits (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      client_name TEXT,
      hours_outside REAL NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

initSchema().catch(err => {
  console.error('Error inicializando schema:', err);
  process.exit(1);
});

module.exports = pool;
