import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { StoreProvider } from './context/StoreContext'
import ProtectedRoute from './components/ProtectedRoute'
import MobileShell from './components/MobileShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Produk from './pages/Produk'
import Kasir from './pages/Kasir'
import Laporan from './pages/Laporan'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <StoreProvider>
                <Routes>
                  <Route element={<MobileShell />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/produk" element={<Produk />} />
                    <Route path="/kasir" element={<Kasir />} />
                    <Route path="/laporan" element={<Laporan />} />
                  </Route>
                </Routes>
              </StoreProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}