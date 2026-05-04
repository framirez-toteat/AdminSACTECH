import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const STATUS_LABEL = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' }
const EMPTY = { employee_id: '', date: '', hours: '', reason: '' }
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const currentYM = () => new Date().toISOString().slice(0, 7)
const ymLabel = ym => { const [y,m] = ym.split('-'); return `${MONTHS_ES[+m-1]} ${y}` }

// ── Export helpers ──────────────────────────────────────────────────────────

const CORAL = [232, 65, 28]
const DARK  = [26, 26, 26]
const CREAM = [232, 221, 208]
const LGRAY = [247, 246, 244]

function addPdfHeader(doc, subtitle) {
  // Dark header band
  doc.setFillColor(...DARK)
  doc.rect(0, 0, 210, 26, 'F')

  // "SAC TECH " in cream
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...CREAM)
  doc.text('SAC TECH ', 14, 17)

  // "Team" in coral — positioned right after
  const sacW = doc.getTextWidth('SAC TECH ')
  doc.setTextColor(...CORAL)
  doc.text('Team', 14 + sacW, 17)

  // Subtitle right-aligned
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...CREAM)
  doc.text(subtitle, 210 - 14, 17, { align: 'right' })

  // Coral accent line under header
  doc.setFillColor(...CORAL)
  doc.rect(0, 26, 210, 1.5, 'F')

  doc.setTextColor(0, 0, 0)
}

function addPdfFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  const today = new Date().toLocaleDateString('es-CL')
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    // Footer line
    doc.setDrawColor(...CORAL)
    doc.setLineWidth(0.4)
    doc.line(14, 284, 196, 284)
    doc.setFontSize(7.5)
    doc.setTextColor(130)
    doc.text(`SAC TECH Team — Generado el ${today}`, 14, 289)
    doc.text(`Página ${i} de ${pageCount}`, 210 - 14, 289, { align: 'right' })
  }
  doc.setTextColor(0, 0, 0)
}

const tableTheme = {
  headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
  alternateRowStyles: { fillColor: LGRAY },
  styles: { fontSize: 9, cellPadding: 3.5 },
  tableLineColor: [220, 220, 220],
  tableLineWidth: 0.2,
}

function exportDetalleXLS(records, ym) {
  const wb = XLSX.utils.book_new()
  // Header rows
  const header = [
    ['SAC TECH — Horas Extras Detalle'],
    [ymLabel(ym)],
    [],
    ['Empleado', 'Fecha', 'Horas', 'Motivo', 'Estado'],
  ]
  const rows = records.map(r => [
    r.employee_name,
    r.date,
    r.hours,
    r.reason || '',
    STATUS_LABEL[r.status],
  ])
  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows])
  ws['!cols'] = [{ wch: 24 }, { wch: 13 }, { wch: 8 }, { wch: 44 }, { wch: 13 }]
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }]
  XLSX.utils.book_append_sheet(wb, ws, 'Detalle')
  XLSX.writeFile(wb, `horas-extras-detalle-${ym}.xlsx`)
}

function exportDetallePDF(records, ym) {
  const doc = new jsPDF()
  addPdfHeader(doc, `Horas Extras — Detalle ${ymLabel(ym)}`)
  autoTable(doc, {
    startY: 36,
    head: [['Empleado', 'Fecha', 'Horas', 'Motivo', 'Estado']],
    body: records.map(r => [
      r.employee_name,
      r.date,
      `${r.hours}h`,
      r.reason || '—',
      STATUS_LABEL[r.status],
    ]),
    columnStyles: { 3: { cellWidth: 65 } },
    ...tableTheme,
  })
  addPdfFooter(doc)
  doc.save(`horas-extras-detalle-${ym}.pdf`)
}

function exportResumenXLS(employeeNames, hoursFor, total, ym) {
  const wb = XLSX.utils.book_new()
  const header = [
    ['SAC TECH — Horas Extras Resumen'],
    [ymLabel(ym)],
    [],
    ['Empleado', 'Horas aprobadas'],
  ]
  const rows = employeeNames
    .filter(emp => hoursFor(emp) > 0)
    .map(emp => [emp, hoursFor(emp)])
  rows.push(['TOTAL', total])
  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows])
  ws['!cols'] = [{ wch: 26 }, { wch: 16 }]
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen')
  XLSX.writeFile(wb, `horas-extras-resumen-${ym}.xlsx`)
}

function exportResumenPDF(employeeNames, hoursFor, hoursDetail, total, ym) {
  const doc = new jsPDF()
  addPdfHeader(doc, `Horas Extras — Resumen ${ymLabel(ym)}`)

  // Summary table
  autoTable(doc, {
    startY: 36,
    head: [['Empleado', 'Total horas aprobadas']],
    body: employeeNames.filter(emp => hoursFor(emp) > 0).map(emp => [emp, `${hoursFor(emp)}h`]),
    foot: [['TOTAL', `${total}h`]],
    footStyles: { fillColor: CORAL, textColor: [255,255,255], fontStyle: 'bold' },
    ...tableTheme,
  })

  // Detail breakdown per employee
  let y = doc.lastAutoTable.finalY + 12
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text('Detalle por empleado', 14, y)
  doc.setFillColor(...CORAL)
  doc.rect(14, y + 2, 40, 0.8, 'F')
  y += 8

  for (const emp of employeeNames) {
    const records = hoursDetail.filter(r => r.employee_name === emp)
    if (!records.length) continue
    autoTable(doc, {
      startY: y,
      head: [[{ content: emp, colSpan: 3, styles: { fillColor: DARK, textColor: CREAM, fontStyle: 'bold' } }]],
      body: records.map(r => [r.date, `${r.hours}h`, r.reason || '—']),
      columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 18 }, 2: { cellWidth: 'auto' } },
      ...tableTheme,
      headStyles: { fillColor: DARK, textColor: CREAM, fontStyle: 'bold', fontSize: 9 },
    })
    y = doc.lastAutoTable.finalY + 6
  }

  addPdfFooter(doc)
  doc.save(`horas-extras-resumen-${ym}.pdf`)
}

// ── ExportMenu ──────────────────────────────────────────────────────────────

function ExportMenu({ onXLS, onPDF, disabled }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-ghost"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        style={{ opacity: disabled ? 0.4 : 1 }}
      >
        ⬇ Exportar
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '110%', right: 0, zIndex: 20,
            background: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 160, overflow: 'hidden',
          }}>
            <button style={menuItem} onClick={() => { onXLS(); setOpen(false) }}>📊 Excel (.xlsx)</button>
            <button style={menuItem} onClick={() => { onPDF(); setOpen(false) }}>📄 PDF</button>
          </div>
        </>
      )}
    </div>
  )
}
const menuItem = {
  display: 'block', width: '100%', padding: '10px 16px',
  background: 'none', border: 'none', textAlign: 'left',
  fontSize: 13.5, cursor: 'pointer', color: '#1a202c',
}

// ── SummaryView ─────────────────────────────────────────────────────────────

function SummaryView({ records, availableMonths }) {
  const [selectedYM, setSelectedYM] = useState(availableMonths[0] || currentYM())

  const approved = records.filter(r => r.status === 'approved' && r.date.slice(0,7) === selectedYM)
  const employeeNames = [...new Set(records.filter(r=>r.status==='approved').map(r => r.employee_name))].sort()

  const hoursFor = emp => approved.filter(r => r.employee_name === emp).reduce((s,r) => s + r.hours, 0)
  const total = approved.reduce((s,r) => s + r.hours, 0)

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <select
          className="form-control"
          style={{ width: 200 }}
          value={selectedYM}
          onChange={e => setSelectedYM(e.target.value)}
        >
          {availableMonths.map(ym => (
            <option key={ym} value={ym}>{ymLabel(ym)}</option>
          ))}
        </select>
        <ExportMenu
          disabled={approved.length === 0}
          onXLS={() => exportResumenXLS(employeeNames, hoursFor, total, selectedYM)}
          onPDF={() => exportResumenPDF(employeeNames, hoursFor, approved, total, selectedYM)}
        />
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <h2>Resumen — {ymLabel(selectedYM)}</h2>
          <span style={{ fontWeight: 700, color: '#7c3aed' }}>Total: {total}h</span>
        </div>
        {approved.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p>No hay horas aprobadas en {ymLabel(selectedYM)}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Empleado</th>
                <th style={{ textAlign: 'center' }}>Horas aprobadas</th>
              </tr>
            </thead>
            <tbody>
              {employeeNames.map(emp => {
                const h = hoursFor(emp)
                if (!h) return null
                return (
                  <tr key={emp}>
                    <td><strong>{emp}</strong></td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: '#7c3aed' }}>{h}h</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                <td style={{ fontWeight: 700, color: '#4a5568' }}>Total</td>
                <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 16, color: '#2563eb' }}>{total}h</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function Overtime() {
  const [records, setRecords] = useState([])
  const [employees, setEmployees] = useState([])
  const [view, setView] = useState('detalle')
  const [filter, setFilter] = useState('all')
  const [selectedYM, setSelectedYM] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const load = () => {
    const qs = filter !== 'all' ? `?status=${filter}` : ''
    fetch(`/api/overtime${qs}`).then(r => r.json()).then(setRecords)
  }
  useEffect(() => { load() }, [filter])
  useEffect(() => { fetch('/api/employees').then(r => r.json()).then(setEmployees) }, [])

  const availableMonths = [...new Set(records.map(r => r.date.slice(0,7)))].sort((a,b) => b.localeCompare(a))
  const filtered = records.filter(r => r.date.slice(0,7) === selectedYM).sort((a,b) => a.date.localeCompare(b.date))
  const totalApproved = filtered.filter(r => r.status === 'approved').reduce((s,r) => s + r.hours, 0)

  const save = async () => {
    if (!form.employee_id || !form.date || !form.hours) { setError('Completa los campos obligatorios'); return }
    const r = await fetch('/api/overtime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, hours: +form.hours })
    })
    if (!r.ok) { const d = await r.json(); setError(d.error); return }
    setSelectedYM(form.date.slice(0,7))
    setShowModal(false); setForm(EMPTY); load()
  }

  const setStatus = async (id, status) => {
    await fetch(`/api/overtime/${id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    load()
  }

  const del = async id => {
    if (!confirm('¿Eliminar este registro?')) return
    await fetch(`/api/overtime/${id}`, { method: 'DELETE' })
    load()
  }

  const FILTERS = [
    { key: 'all', label: 'Todos' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'approved', label: 'Aprobados' },
    { key: 'rejected', label: 'Rechazados' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Horas Extras</h1>
          <p className="page-subtitle">Registro y aprobacion de horas adicionales</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${view === 'detalle' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('detalle')}
          >📋 Detalle</button>
          <button
            className={`btn ${view === 'resumen' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('resumen')}
          >📊 Resumen</button>
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setError(''); setShowModal(true) }}>
            + Registrar
          </button>
        </div>
      </div>

      {/* VISTA RESUMEN */}
      {view === 'resumen' && (
        <SummaryView records={records} availableMonths={availableMonths} />
      )}

      {/* VISTA DETALLE */}
      {view === 'detalle' && <>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <select
            className="form-control"
            style={{ width: 200 }}
            value={selectedYM}
            onChange={e => setSelectedYM(e.target.value)}
          >
            <option value="">Seleccionar mes...</option>
            {availableMonths.map(ym => (
              <option key={ym} value={ym}>{ymLabel(ym)}</option>
            ))}
          </select>
          <div className="filter-bar">
            {FILTERS.map(f => (
              <button key={f.key} className={`filter-btn${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
          <ExportMenu
            disabled={filtered.length === 0}
            onXLS={() => exportDetalleXLS(filtered, selectedYM)}
            onPDF={() => exportDetallePDF(filtered, selectedYM)}
          />
        </div>

        {filtered.length > 0 && (
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-icon">⏰</div>
              <div className="stat-label">Horas aprobadas — {ymLabel(selectedYM)}</div>
              <div className="stat-value" style={{ color: '#7c3aed' }}>{totalApproved}h</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-label">Registros del mes</div>
              <div className="stat-value" style={{ color: '#2563eb' }}>{filtered.length}</div>
            </div>
          </div>
        )}

        <div className="table-container">
          <div className="table-toolbar">
            <h2>{selectedYM ? ymLabel(selectedYM) : 'Selecciona un mes'}</h2>
            {selectedYM && <span className="muted" style={{ fontSize: 13 }}>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>}
          </div>
          {!selectedYM ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <p>Selecciona un mes para ver los registros</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⏰</div>
              <p>No hay registros para {ymLabel(selectedYM)}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Fecha</th>
                  <th>Horas</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(rec => (
                  <tr key={rec.id}>
                    <td><strong>{rec.employee_name}</strong></td>
                    <td>{rec.date}</td>
                    <td><strong>{rec.hours}h</strong></td>
                    <td className="muted" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.reason || '—'}</td>
                    <td><span className={`badge badge-${rec.status}`}>{STATUS_LABEL[rec.status]}</span></td>
                    <td>
                      <div className="actions">
                        {rec.status === 'pending' && <>
                          <button className="btn btn-success btn-sm" onClick={() => setStatus(rec.id, 'approved')}>Aprobar</button>
                          <button className="btn btn-warning btn-sm" onClick={() => setStatus(rec.id, 'rejected')}>Rechazar</button>
                        </>}
                        {rec.status !== 'pending' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setStatus(rec.id, 'pending')}>Reabrir</button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => del(rec.id)}>X</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 className="modal-title">Registrar horas extras</h2>
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
                <label className="form-label">Horas *</label>
                <input className="form-control" type="number" min="0.5" step="0.5" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} placeholder="Ej: 2.5" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Motivo</label>
              <textarea className="form-control" rows="2" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Descripcion del trabajo realizado..." />
            </div>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
