const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { employee_id } = req.query;
    const params = [];
    let conditions = '';
    if (employee_id) { params.push(employee_id); conditions += ` AND cv.employee_id = $${params.length}`; }

    const { rows } = await pool.query(`
      SELECT cv.*, e.name AS employee_name, e.department
      FROM client_visits cv
      JOIN employees e ON cv.employee_id = e.id
      WHERE 1=1${conditions}
      ORDER BY cv.date DESC
    `, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { employee_id, date, client_name, hours_outside, notes } = req.body;
    if (!employee_id || !date || !hours_outside) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    const { rows } = await pool.query(`
      INSERT INTO client_visits (employee_id, date, client_name, hours_outside, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [employee_id, date, client_name || null, hours_outside, notes || null]);
    res.json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM client_visits WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
