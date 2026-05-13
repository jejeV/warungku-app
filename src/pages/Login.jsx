import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode]         = useState('login')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password)
      }
      navigate('/')
    } catch (err) {
      console.error('[Login] Error:', err)

      const msg = err?.message ?? ''
      if (msg.includes('Invalid login credentials')) {
        setError('Email atau password salah. Periksa kembali.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Email belum dikonfirmasi. Cek inbox / spam kamu.')
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError('Gagal terhubung ke server. Cek koneksi internet kamu.')
      } else if (msg.includes('rate limit') || msg.includes('too many')) {
        setError('Terlalu banyak percobaan. Tunggu beberapa menit.')
      } else if (msg.includes('User already registered')) {
        setError('Email sudah terdaftar. Silakan masuk.')
      } else {
        setError(msg || 'Terjadi kesalahan. Coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-stone-800">WarungKu 🏪</h1>
          <p className="text-stone-400 text-sm mt-1">Manajemen stok & pendapatan toko</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-stone-700 mb-4">
            {mode === 'login' ? 'Masuk ke akun' : 'Daftar akun baru'}
          </h2>

          <div className="flex flex-col gap-3">
            <input
              className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-brand-400"
              type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-brand-400"
              type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />

            {/* ✅ Error box dengan pesan informatif */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                <p className="text-red-500 text-xs leading-relaxed">⚠️ {error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit} disabled={loading}
              className="w-full py-3 bg-brand-500 text-white rounded-2xl font-bold text-sm disabled:opacity-50"
            >
              {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
            </button>
          </div>

          <p className="text-center text-xs text-stone-400 mt-4">
            {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <button
              className="text-brand-500 font-semibold"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            >
              {mode === 'login' ? 'Daftar' : 'Masuk'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}