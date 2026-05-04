const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { employee_id, status } = req.query;
    const params = [];
    let conditions = '';
    if (employee_id) { params.push(employee_id); conditions += ` AND o.employee_id = $${params.length}`; }
    if (status)      { params.push(status);      conditions += ` AND o.status = $${params.length}`; }

    const { rows } = await pool.query(`
      SELECT o.*, e.name AS employee_name, e.department
      FROM overtime o
      JOIN employees e ON o.employee_id = e.id
      WHERE 1=1${conditions}
      ORDER BY o.date DESC
    `, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { employee_id, date, hours, reason } = req.body;
    if (!employee_id || !date || !hours) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    const { rows } = await pool.query(`
      INSERT INTO overtime (employee_id, date, hours, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [employee_id, date, hours, reason || null]);
    res.json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    await pool.query('UPDATE overtime SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM overtime WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
