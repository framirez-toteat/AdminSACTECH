import { useState, useEffect } from 'react'

const STATUS_LABEL = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' }
const EMPTY = { employee_id: '', start_date: '', end_date: '', days_count: '', notes: '' }

function calcDays(start, end) {
  if (!start || !end) return ''
  const ms = new Date(end) - new Date(start)
  if (ms < 0) return ''
  return Math.round(ms / 86400000) + 1
}

export default function Vacations() {
  const [vacations, setVacations] = useState([])
  const [employees, setEmployees] = useState([])
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const load = () => {
    const qs = filter !== 'all' ? `?status=${filter}` : ''
    fetch(`/api/vacations${qs}`).then(r => r.json()).then(setVacations)
  }
  useEffect(() => { load() }, [filter])
  useEffect(() => { fetch('/api/employees').then(r => r.json()).then(setEmployees) }, [])

  const updateDate = (field, val) => {
    setForm(f => {
      const next = { ...f, [field]: val }
      const auto = calcDays(next.start_date, next.end_date)
      if (auto) next.days_count = auto
      return next
    })
  }

  const save = async () => {
    if (!form.employee_id || !form.start_date || !form.end_date || !form.days_count) {
      setError('Completa todos los campos obligatorios'); return
    }
    const r = await fetch('/api/vacations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, days_count: +form.days_count })
    })
    if (!r.ok) { const d = await r.json(); setError(d.error); return }
    setShowModal(false); setForm(EMPTY); load()
  }

  const setStatus = async (id, status) => {
    await fetch(`/api/vacations/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    load()
  }

  const del = async id => {
    if (!confirm('¿Eliminar esta solicitud?')) return
    await fetch(`/api/vacations/${id}`, { method: 'DELETE' })
    load()
  }

  const FILTERS = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'approved', label: 'Aprobadas' },
    { key: 'rejected', label: 'Rechazadas' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vacaciones</h1>
          <p className="page-subtitle">Solicitudes y aprobaciones del equipo</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setError(''); setShowModal(true) }}>
          + Nueva solicitud
        </button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <h2>{vacations.length} registro{vacations.length !== 1 ? 's' : ''}</h2>
          <div className="filter-bar">
            {FILTERS.map(f => (
              <button key={f.key} className={`filter-btn${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {vacations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏖️</div>
            <p>No hay solicitudes de vacaciones {filter !== 'all' ? 'con este estado' : ''}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Departamento</th>
                <th>Desde</th>
                <th>Hasta</th>
                <th>Dias</th>
                <th>Notas</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vacations.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.employee_name}</strong></td>
                  <td className="muted">{v.department || '—'}</td>
                  <td>{v.start_date}</td>
                  <td>{v.end_date}</td>
                  <td><strong>{v.days_count}</strong></td>
                  <td className="muted" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.notes || '—'}</td>
                  <td><span className={`badge badge-${v.status}`}>{STATUS_LABEL[v.status]}</span></td>
                  <td>
                    <div className="actions">
                      {v.status === 'pending' && <>
                        <button className="btn btn-success btn-sm" onClick={() => setStatus(v.id, 'approved')}>Aprobar</button>
                        <button className="btn btn-warning btn-sm" onClick={() => setStatus(v.id, 'rejected')}>Rechazar</button>
                      </>}
                      {v.status !== 'pending' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setStatus(v.id, 'pending')}>Reabrir</button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => del(v.id)}>X</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 className="modal-title">Nueva solicitud de vacaciones</h2>
            {error && <div className="error-banner">{error}</div>}
            <div className="form-group">
              <label className="form-label">Empleado *</label>
              <select className="form-control" value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}{e.department ? ` — ${e.department}` : ''}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fecha inicio *</label>
                <input className="form-control" type="date" value={form.start_date} onChange={e => updateDate('start_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha fin *</label>
                <input className="form-control" type="date" value={form.end_date} onChange={e => updateDate('end_date', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Numero de dias *</label>
              <input className="form-control" type="number" min="1" value={form.days_count} onChange={e => setForm(f => ({ ...f, days_count: e.target.value }))} placeholder="Se calcula automaticamente" />
            </div>
            <div className="form-group">
              <label className="form-label">Notas</label>
              <textarea className="form-control" rows="2" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Motivo u observaciones..." />
            </div>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Registrar solicitud</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
