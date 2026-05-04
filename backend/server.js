const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/employees', require('./routes/employees'));
app.use('/api/vacations', require('./routes/vacations'));
app.use('/api/overtime', require('./routes/overtime'));
app.use('/api/visits', require('./routes/visits'));

app.get('/api/dashboard', async (req, res) => {
  try {
    const yearMonth = new Date().toISOString().slice(0, 7);

    const [totalEmployees, pendingVacations, pendingOvertime, overtimeThisMonth, visitsThisMonth] = await Promise.all([
      pool.query('SELECT COUNT(*) AS count FROM employees'),
      pool.query("SELECT COUNT(*) AS count FROM vacations WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*) AS count FROM overtime WHERE status = 'pending'"),
      pool.query(`
        SELECT COALESCE(SUM(hours), 0) AS total FROM overtime
        WHERE status = 'approved' AND TO_CHAR(date, 'YYYY-MM') = $1
      `, [yearMonth]),
      pool.query(`
        SELECT COUNT(*) AS count FROM client_visits
        WHERE TO_CHAR(date, 'YYYY-MM') = $1
      `, [yearMonth])
    ]);

    res.json({
      totalEmployees: parseInt(totalEmployees.rows[0].count),
      pendingVacations: parseInt(pendingVacations.rows[0].count),
      pendingOvertime: parseInt(pendingOvertime.rows[0].count),
      overtimeHoursThisMonth: parseFloat(overtimeThisMonth.rows[0].total),
      visitsThisMonth: parseInt(visitsThisMonth.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
