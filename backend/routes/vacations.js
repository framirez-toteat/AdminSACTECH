const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { employee_id, status } = req.query;
  let query = `
    SELECT v.*, e.name as employee_name, e.department
    FROM vacations v
    JOIN employees e ON v.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];
  if (employee_id) { query += ' AND v.employee_id = ?'; params.push(employee_id); }
  if (status) { query += ' AND v.status = ?'; params.push(status); }
  query += ' ORDER BY v.created_at DESC';
  res.json(db.prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const { employee_id, start_date, end_date, days_count, notes } = req.body;
  if (!employee_id || !start_date || !end_date || !days_count) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const result = db.prepare(`
    INSERT INTO vacations (employee_id, start_date, end_date, days_count, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(employee_id, start_date, end_date, days_count, notes || null);
  res.json({ id: result.lastInsertRowid });
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  db.prepare('UPDATE vacations SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM vacations WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
