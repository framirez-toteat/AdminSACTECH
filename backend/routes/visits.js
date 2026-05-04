const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { employee_id } = req.query;
  let query = `
    SELECT cv.*, e.name as employee_name, e.department
    FROM client_visits cv
    JOIN employees e ON cv.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];
  if (employee_id) { query += ' AND cv.employee_id = ?'; params.push(employee_id); }
  query += ' ORDER BY cv.date DESC';
  res.json(db.prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const { employee_id, date, client_name, hours_outside, notes } = req.body;
  if (!employee_id || !date || !hours_outside) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const result = db.prepare(`
    INSERT INTO client_visits (employee_id, date, client_name, hours_outside, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(employee_id, date, client_name || null, hours_outside, notes || null);
  res.json({ id: result.lastInsertRowid });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM client_visits WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
