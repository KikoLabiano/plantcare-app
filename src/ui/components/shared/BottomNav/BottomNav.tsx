import { NavLink } from 'react-router-dom'
import styles from './BottomNav.module.css'

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: '⌂', end: true },
  { to: '/plants', label: 'Plantas', icon: '❧', end: false },
  { to: '/add', label: 'Añadir', icon: '+', end: false },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {NAV_ITEMS.map(({ to, label, icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? 'active' : ''}`
          }
          aria-label={label}
        >
          <span className={styles.icon} aria-hidden="true">{icon}</span>
          <span className="bottom-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
