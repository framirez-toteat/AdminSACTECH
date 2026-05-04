const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { employee_id, status } = req.query;
  let query = `
    SELECT o.*, e.name as employee_name, e.department
    FROM overtime o
    JOIN employees e ON o.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];
  if (employee_id) { query += ' AND o.employee_id = ?'; params.push(employee_id); }
  if (status) { query += ' AND o.status = ?'; params.push(status); }
  query += ' ORDER BY o.date DESC';
  res.json(db.prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const { employee_id, date, hours, reason } = req.body;
  if (!employee_id || !date || !hours) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const result = db.prepare(`
    INSERT INTO overtime (employee_id, date, hours, reason)
    VALUES (?, ?, ?, ?)
  `).run(employee_id, date, hours, reason || null);
  res.json({ id: result.lastInsertRowid });
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  db.prepare('UPDATE overtime SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM overtime WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
