import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function MobileShell() {
  return (
    <div className="app-root">
      {/* Page content */}
      <main className="app-content">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <BottomNav />
    </div>
  )
}
