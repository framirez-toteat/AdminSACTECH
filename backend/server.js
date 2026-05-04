const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/employees', require('./routes/employees'));
app.use('/api/vacations', require('./routes/vacations'));
app.use('/api/overtime', require('./routes/overtime'));
app.use('/api/visits', require('./routes/visits'));

app.get('/api/dashboard', (req, res) => {
  const yearMonth = new Date().toISOString().slice(0, 7);

  const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees').get();
  const pendingVacations = db.prepare("SELECT COUNT(*) as count FROM vacations WHERE status = 'pending'").get();
  const pendingOvertime = db.prepare("SELECT COUNT(*) as count FROM overtime WHERE status = 'pending'").get();
  const overtimeThisMonth = db.prepare(`
    SELECT COALESCE(SUM(hours), 0) as total FROM overtime
    WHERE status = 'approved' AND strftime('%Y-%m', date) = ?
  `).get(yearMonth);
  const visitsThisMonth = db.prepare(`
    SELECT COUNT(*) as count FROM client_visits
    WHERE strftime('%Y-%m', date) = ?
  `).get(yearMonth);

  res.json({
    totalEmployees: totalEmployees.count,
    pendingVacations: pendingVacations.count,
    pendingOvertime: pendingOvertime.count,
    overtimeHoursThisMonth: overtimeThisMonth.total,
    visitsThisMonth: visitsThisMonth.count
  });
});

// Servir el frontend en producción
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
