import { useState, useEffect } from 'react'

const STATUS_LABEL = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' }

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [pendingVacations, setPendingVacations] = useState([])

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setStats)
    fetch('/api/vacations?status=pending').then(r => r.json()).then(d => setPendingVacations(d.slice(0, 6)))
  }, [])

  if (!stats) return <div style={{ padding: 40, color: '#718096' }}>Cargando...</div>

  const cards = [
    { label: 'Empleados',               value: stats.totalEmployees,          icon: '👥', color: '#2563eb' },
    { label: 'Vacaciones Pendientes',   value: stats.pendingVacations,        icon: '🏖️', color: '#d97706' },
    { label: 'Horas Extras Pendientes', value: stats.pendingOvertime,         icon: '⏰', color: '#7c3aed' },
    { label: 'Horas Extras (este mes)', value: `${stats.overtimeHoursThisMonth}h`, icon: '📈', color: '#059669' },
    { label: 'Visitas (este mes)',       value: stats.visitsThisMonth,         icon: '🤝', color: '#dc2626' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen general del equipo</p>
        </div>
      </div>

      <div className="stats-grid">
        {cards.map(c => (
          <div key={c.label} className="stat-card">
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {pendingVacations.length > 0 && (
        <div className="table-container">
          <div className="table-toolbar">
            <h2>Vacaciones pendientes de aprobacion</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Departamento</th>
                <th>Desde</th>
                <th>Hasta</th>
                <th>Dias</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pendingVacations.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.employee_name}</strong></td>
                  <td className="muted">{v.department || '—'}</td>
                  <td>{v.start_date}</td>
                  <td>{v.end_date}</td>
                  <td>{v.days_count}</td>
                  <td><span className={`badge badge-${v.status}`}>{STATUS_LABEL[v.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pendingVacations.length === 0 && stats.pendingVacations === 0 && (
        <div className="table-container">
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <p>No hay solicitudes de vacaciones pendientes</p>
          </div>
        </div>
      )}
    </div>
  )
}
