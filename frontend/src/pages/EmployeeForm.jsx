import { useState, useEffect } from 'react'

const EMPTY = { employee_id: '', date: '', hours: '', reason: '' }

export default function EmployeeForm() {
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(data => setEmployees(data.filter(e => e.accrual_rate > 0 || e.position !== 'Desvinculado')))
  }, [])

  const submit = async () => {
    if (!form.employee_id || !form.date || !form.hours) {
      setError('Por favor completa todos los campos marcados con *')
      return
    }
    if (+form.hours <= 0) {
      setError('Las horas deben ser mayor a 0')
      return
    }
    setLoading(true)
    setError('')
    const r = await fetch('/api/overtime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, hours: +form.hours })
    })
    setLoading(false)
    if (!r.ok) {
      const d = await r.json()
      setError(d.error || 'Error al enviar, intenta de nuevo')
      return
    }
    setSent(true)
  }

  const reset = () => {
    setForm(EMPTY)
    setError('')
    setSent(false)
  }

  const today = new Date().toISOString().split('T')[0]

  if (sent) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.successTitle}>¡Registro enviado!</h2>
          <p style={styles.successText}>
            Tus horas extras fueron enviadas correctamente.<br />
            Quedan pendientes de aprobación.
          </p>
          <button style={styles.btnPrimary} onClick={reset}>
            Registrar otro
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>⏰</div>
          <h1 style={styles.title}>Horas Extras</h1>
          <p style={styles.subtitle}>SAC TECH — Registro de equipo</p>
        </div>

        {error && (
          <div style={styles.errorBanner}>{error}</div>
        )}

        {/* Form */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Tu nombre *</label>
          <select
            style={styles.input}
            value={form.employee_id}
            onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
          >
            <option value="">Seleccionar...</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Fecha *</label>
          <input
            style={styles.input}
            type="date"
            max={today}
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Horas extras *</label>
          <input
            style={styles.input}
            type="number"
            min="0.5"
            step="0.5"
            placeholder="Ej: 2.5"
            value={form.hours}
            onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Motivo / Descripción</label>
          <textarea
            style={{ ...styles.input, resize: 'vertical', minHeight: 80 }}
            placeholder="¿Qué trabajo realizaste?"
            value={form.reason}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
          />
        </div>

        <button
          style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
          onClick={submit}
          disabled={loading}
        >
          {loading ? 'Enviando...' : 'Enviar registro'}
        </button>

        <p style={styles.footer}>
          Tu solicitud quedará pendiente hasta que sea aprobada por el equipo de administración.
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '24px 16px 48px',
  },
  card: {
    background: 'white',
    borderRadius: 16,
    padding: '28px 24px',
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: {
    textAlign: 'center',
    marginBottom: 28,
  },
  logo: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1a202c',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: '#718096',
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#4a5568',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 15,
    color: '#1a202c',
    background: 'white',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
  },
  btnPrimary: {
    width: '100%',
    padding: '13px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },
  errorBanner: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13.5,
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 52,
    textAlign: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1a202c',
    textAlign: 'center',
    margin: '0 0 8px',
  },
  successText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 1.6,
    marginBottom: 24,
  },
  footer: {
    fontSize: 11.5,
    color: '#a0aec0',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 1.5,
  },
}
