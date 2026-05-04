const express = require('express');
const router = express.Router();
const pool = require('../db');

const today = () => new Date().toISOString().slice(0, 10);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.*,
        ROUND((
          COALESCE(e.balance_initial, 0) +
          (CURRENT_DATE - COALESCE(e.balance_date, CURRENT_DATE))::float
            * COALESCE(e.accrual_rate, 15) / 365.0 -
          COALESCE((
            SELECT SUM(v.days_count) FROM vacations v
            WHERE v.employee_id = e.id AND v.status = 'approved'
            AND v.start_date >= COALESCE(e.balance_date, CURRENT_DATE)
          ), 0)
        )::numeric, 2)::float AS current_balance,
        COALESCE((
          SELECT SUM(o.hours) FROM overtime o
          WHERE o.employee_id = e.id AND o.status = 'approved'
        ), 0)::float AS overtime_hours_total
      FROM employees e
      ORDER BY e.name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM employees WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, department, position, balance_initial, balance_date, accrual_rate } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const { rows } = await pool.query(`
      INSERT INTO employees (name, email, department, position, vacation_days_per_year, balance_initial, balance_date, accrual_rate)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      name,
      email || null,
      department || null,
      position || null,
      accrual_rate || 15,
      balance_initial ?? 0,
      balance_date || today(),
      accrual_rate || 15
    ]);
    res.json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, department, position, balance_initial, balance_date, accrual_rate } = req.body;
    await pool.query(`
      UPDATE employees
      SET name=$1, email=$2, department=$3, position=$4,
          vacation_days_per_year=$5, balance_initial=$6, balance_date=$7, accrual_rate=$8
      WHERE id=$9
    `, [
      name,
      email || null,
      department || null,
      position || null,
      accrual_rate || 15,
      balance_initial ?? 0,
      balance_date || today(),
      accrual_rate || 15,
      req.params.id
    ]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
