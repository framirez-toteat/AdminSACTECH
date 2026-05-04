import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Vacations from './pages/Vacations'
import Overtime from './pages/Overtime'
import Visits from './pages/Visits'
import EmployeeForm from './pages/EmployeeForm'

const NAV = [
  { to: '/',             end: true,  icon: '📊', label: 'Dashboard'          },
  { to: '/empleados',    end: false, icon: '👥', label: 'Empleados'          },
  { to: '/vacaciones',   end: false, icon: '🏖️', label: 'Vacaciones'         },
  { to: '/horas-extras', end: false, icon: '⏰', label: 'Horas Extras'       },
  { to: '/visitas',      end: false, icon: '🤝', label: 'Visitas a Clientes' },
]

function AdminLayout() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Consola de Equipo</h1>
          <div className="sub">Gestión de personal</div>
        </div>
        <nav>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 12px 8px' }}>Módulos</div>
          {NAV.map(({ to, end, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/empleados"    element={<Employees />} />
          <Route path="/vacaciones"   element={<Vacations />} />
          <Route path="/horas-extras" element={<Overtime />} />
          <Route path="/visitas"      element={<Visits />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/registrar" element={<EmployeeForm />} />
        <Route path="/*" element={<AdminLayout />} />
      </Routes>
    </BrowserRouter>
  )
}
