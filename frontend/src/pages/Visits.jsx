import { useState, useEffect } from 'react'

const EMPTY = { employee_id: '', date: '', client_name: '', hours_outside: '', notes: '' }

export default function Visits() {
  const [visits, setVisits] = useState([])
  const [employees, setEmployees] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const load = () => fetch('/api/visits').then(r => r.json()).then(setVisits)
  useEffect(() => { load() }, [])
  useEffect(() => { fetch('/api/employees').then(r => r.json()).then(setEmployees) }, [])

  const save = async () => {
    if (!form.employee_id || !form.date || !form.hours_outside) {
      setError('Completa los campos obligatorios'); return
    }
    const r = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, hours_outside: +form.hours_outside })
    })
    if (!r.ok) { const d = await r.json(); setError(d.error); return }
    setShowModal(false); setForm(EMPTY); load()
  }

  const del = async id => {
    if (!confirm('¿Eliminar este registro de visita?')) return
    await fetch(`/api/visits/${id}`, { method: 'DELETE' })
    load()
  }

  const totalHours = visits.reduce((s, v) => s + v.hours_outside, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Visitas a Clientes</h1>
          <p className="page-subtitle">Visitas presenciales realizadas fuera del horario habitual</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setError(''); setShowModal(true) }}>
          + Registrar visita
        </button>
      </div>

      {visits.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-icon">🤝</div>
            <div className="stat-label">Total visitas registradas</div>
            <div className="stat-value" style={{ color: '#dc2626' }}>{visits.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-label">Horas fuera de horario (total)</div>
            <div className="stat-value" style={{ color: '#7c3aed' }}>{totalHours}h</div>
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="table-toolbar">
          <h2>{visits.length} visita{visits.length !== 1 ? 's' : ''} registrada{visits.length !== 1 ? 's' : ''}</h2>
        </div>

        {visits.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🤝</div>
            <p>Aun no hay visitas registradas</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Departamento</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Horas fuera de horario</th>
                <th>Notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visits.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.employee_name}</strong></td>
                  <td className="muted">{v.department || '—'}</td>
                  <td>{v.date}</td>
                  <td>{v.client_name || <span className="muted">—</span>}</td>
                  <td><strong>{v.hours_outside}h</strong></td>
                  <td className="muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.notes || '—'}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => del(v.id)}>Eliminar</button>
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
            <h2 className="modal-title">Registrar visita a cliente</h2>
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
                <label className="form-label">Fecha *</label>
                <input className="form-control" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Horas fuera de horario *</label>
                <input className="form-control" type="number" min="0.5" step="0.5" value={form.hours_outside} onChange={e => setForm(f => ({ ...f, hours_outside: e.target.value }))} placeholder="Ej: 3" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Cliente</label>
              <input className="form-control" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Nombre del cliente o empresa" />
            </div>
            <div className="form-group">
              <label className="form-label">Notas</label>
              <textarea className="form-control" rows="2" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Descripcion de la visita..." />
            </div>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Registrar visita</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
