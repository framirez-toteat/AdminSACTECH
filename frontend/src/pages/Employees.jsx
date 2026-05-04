import { useState, useEffect } from 'react'

const today = () => new Date().toISOString().slice(0, 10)
const EMPTY = { name: '', email: '', department: '', position: '', balance_initial: 0, balance_date: today(), accrual_rate: 15 }

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')

  const load = () => fetch('/api/employees').then(r => r.json()).then(setEmployees)
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(EMPTY); setEditId(null); setError(''); setShowModal(true) }

  const openEdit = emp => {
    setForm({
      name: emp.name,
      email: emp.email || '',
      department: emp.department || '',
      position: emp.position || '',
      balance_initial: emp.current_balance ?? 0,
      balance_date: today(),
      accrual_rate: emp.accrual_rate || 15
    })
    setEditId(emp.id)
    setError('')
    setShowModal(true)
  }

  const save = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    const url = editId ? `/api/employees/${editId}` : '/api/employees'
    const method = editId ? 'PUT' : 'POST'
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, balance_initial: +form.balance_initial, accrual_rate: +form.accrual_rate })
    })
    if (!r.ok) { const d = await r.json(); setError(d.error); return }
    setShowModal(false)
    load()
  }

  const del = async id => {
    if (!confirm('¿Eliminar este empleado y todos sus registros?')) return
    await fetch(`/api/employees/${id}`, { method: 'DELETE' })
    load()
  }

  const balanceColor = days => days <= 0 ? '#dc2626' : days <= 3 ? '#d97706' : '#16a34a'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Empleados</h1>
          <p className="page-subtitle">{employees.length} persona{employees.length !== 1 ? 's' : ''} en el equipo</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Agregar empleado</button>
      </div>

      <div className="table-container">
        {employees.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>Aun no hay empleados. Agrega el primero.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Departamento</th>
                <th>Cargo</th>
                <th>Saldo vacaciones</th>
                <th>Acumulacion</th>
                <th>Horas extras</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(e => {
                const bal = e.current_balance ?? 0
                return (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.name}</strong>
                      {e.email && <div style={{ fontSize: 12, color: '#a0aec0' }}>{e.email}</div>}
                    </td>
                    <td className="muted">{e.department || '—'}</td>
                    <td className="muted">{e.position || '—'}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: balanceColor(bal)
                      }}>
                        {bal.toFixed(2)} días
                      </span>
                    </td>
                    <td className="muted">{e.accrual_rate || 15} días/año</td>
                    <td>{e.overtime_hours_total > 0 ? `${e.overtime_hours_total}h` : <span className="muted">0h</span>}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => del(e.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 className="modal-title">{editId ? 'Editar empleado' : 'Nuevo empleado'}</h2>
            {error && <div className="error-banner">{error}</div>}
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Ana Garcia" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ana@empresa.com" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Departamento</label>
                <input className="form-control" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="Ej: Ventas" />
              </div>
              <div className="form-group">
                <label className="form-label">Cargo</label>
                <input className="form-control" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="Ej: Ejecutivo" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Saldo actual (días) *</label>
                <input className="form-control" type="number" min="0" step="0.01" value={form.balance_initial}
                  onChange={e => setForm(f => ({ ...f, balance_initial: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de corte *</label>
                <input className="form-control" type="date" value={form.balance_date}
                  onChange={e => setForm(f => ({ ...f, balance_date: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Días de vacaciones por año</label>
              <input className="form-control" type="number" min="1" step="0.5" value={form.accrual_rate}
                onChange={e => setForm(f => ({ ...f, accrual_rate: e.target.value }))} />
            </div>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>{editId ? 'Guardar cambios' : 'Agregar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
