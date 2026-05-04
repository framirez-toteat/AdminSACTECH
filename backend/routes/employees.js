const express = require('express');
const router = express.Router();
const db = require('../db');

const today = () => new Date().toISOString().slice(0, 10);

router.get('/', (req, res) => {
  const employees = db.prepare(`
    SELECT e.*,
      ROUND(
        COALESCE(e.balance_initial, 0) +
        (CAST(julianday('now') - julianday(COALESCE(e.balance_date, date('now'))) AS REAL)
          * COALESCE(e.accrual_rate, 15) / 365.0) -
        COALESCE((
          SELECT SUM(v.days_count) FROM vacations v
          WHERE v.employee_id = e.id AND v.status = 'approved'
          AND v.start_date >= COALESCE(e.balance_date, date('now'))
        ), 0),
        2
      ) as current_balance,
      COALESCE((
        SELECT SUM(o.hours) FROM overtime o
        WHERE o.employee_id = e.id AND o.status = 'approved'
      ), 0) as overtime_hours_total
    FROM employees e
    ORDER BY e.name
  `).all();
  res.json(employees);
});

router.get('/:id', (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'No encontrado' });
  res.json(emp);
});

router.post('/', (req, res) => {
  const { name, email, department, position, balance_initial, balance_date, accrual_rate } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
  const result = db.prepare(`
    INSERT INTO employees (name, email, department, position, vacation_days_per_year, balance_initial, balance_date, accrual_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, email || null, department || null, position || null,
    accrual_rate || 15,
    balance_initial ?? 0,
    balance_date || today(),
    accrual_rate || 15
  );
  res.json({ id: Number(result.lastInsertRowid) });
});

router.put('/:id', (req, res) => {
  const { name, email, department, position, balance_initial, balance_date, accrual_rate } = req.body;
  db.prepare(`
    UPDATE employees
    SET name=?, email=?, department=?, position=?,
        vacation_days_per_year=?, balance_initial=?, balance_date=?, accrual_rate=?
    WHERE id=?
  `).run(
    name, email || null, department || null, position || null,
    accrual_rate || 15,
    balance_initial ?? 0,
    balance_date || today(),
    accrual_rate || 15,
    req.params.id
  );
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
