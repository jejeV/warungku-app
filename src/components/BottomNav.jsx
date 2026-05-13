import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingCart, BarChart2, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/produk',  icon: Package,         label: 'Produk' },
  { to: '/kasir',   icon: ShoppingCart,    label: 'Kasir' },
  { to: '/laporan', icon: BarChart2,       label: 'Laporan' },
]

export default function BottomNav() {
  const { logout } = useAuth()

  return (
    <nav className="bottom-nav">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `nav-item ${isActive ? 'nav-item--active' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`nav-icon-wrap ${isActive ? 'nav-icon-wrap--active' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className="nav-label">{label}</span>
            </>
          )}
        </NavLink>
      ))}

      <button onClick={logout} className="nav-item">
        <div className="nav-icon-wrap">
          <LogOut size={20} strokeWidth={1.8} />
        </div>
        <span className="nav-label">Keluar</span>
      </button>
    </nav>
  )
}