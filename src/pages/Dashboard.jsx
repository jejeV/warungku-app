import { useState, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import { supabase } from '../lib/supabase' 
import { TrendingUp, AlertTriangle, ShoppingBag } from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

function fmt(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID')
}

export default function Dashboard() {
  const { store } = useStore()

  const [transaksi, setTransaksi]           = useState([])
  const [products, setProducts]             = useState([])
  const [stokRendah, setStokRendah]         = useState([])
  const [pendapatanHariIni, setPendapatan]  = useState(0)
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    if (!store?.id) return
    fetchAll()
  }, [store?.id])

  async function fetchAll() {
    setLoading(true)

    // Ambil 7 hari ke belakang untuk chart + transaksi terakhir
    const cutoff7 = new Date(Date.now() - 86400000 * 7).toISOString()

    const [{ data: txData }, { data: prodData }] = await Promise.all([
      supabase
        .from('transaksi')
        .select('*')
        .eq('store_id', store.id)
        .gte('created_at', cutoff7)
        .order('created_at', { ascending: false }),

      supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id),
    ])

    const tx   = txData   || []
    const prod = prodData || []

    // Pendapatan hari ini
    const todayStr = new Date().toDateString()
    const hariIni = tx
      .filter(t => new Date(t.created_at).toDateString() === todayStr)
      .reduce((s, t) => s + (t.total || 0), 0)

    // Stok rendah = stok <= min_stok
    const rendah = prod.filter(p => p.stok <= p.min_stok)

    setTransaksi(tx)
    setProducts(prod)
    setPendapatan(hariIni)
    setStokRendah(rendah)
    setLoading(false)
  }

  // Chart 7 hari — pakai created_at
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const label = d.toLocaleDateString('id-ID', { weekday: 'short' })
    const total = transaksi
      .filter(t => new Date(t.created_at).toDateString() === d.toDateString())
      .reduce((s, t) => s + (t.total || 0), 0)
    return { label, total }
  })

  const totalTransaksiHariIni = transaksi.filter(t =>
    new Date(t.created_at).toDateString() === new Date().toDateString()
  ).length

  return (
    <div className="px-5 pb-4 slide-up">
      {/* Header */}
      <div className="pt-6 pb-4">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Selamat datang</p>
        <h1 className="text-2xl font-extrabold text-stone-800 mt-0.5">
          {store?.nama || 'WarungKu'} 🏪
        </h1>
        <p className="text-xs text-stone-400 mt-0.5">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Pendapatan hari ini */}
      <div className="rounded-3xl p-5 mb-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #E97400 0%, #FF8F0F 60%, #FFAA42 100%)' }}>
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -right-2 w-24 h-24 rounded-full bg-white/5" />
        <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider">Pendapatan Hari Ini</p>
        <p className="text-white text-3xl font-extrabold mt-1 font-mono tracking-tight">
          {loading ? '...' : fmt(pendapatanHariIni)}
        </p>
        <div className="flex gap-4 mt-3">
          <div>
            <p className="text-orange-200 text-[10px]">Transaksi</p>
            <p className="text-white text-sm font-bold">{totalTransaksiHariIni}x</p>
          </div>
          <div>
            <p className="text-orange-200 text-[10px]">Total Produk</p>
            <p className="text-white text-sm font-bold">{products.length}</p>
          </div>
          <div>
            <p className="text-orange-200 text-[10px]">Stok Rendah</p>
            <p className="text-white text-sm font-bold">{stokRendah.length} item</p>
          </div>
        </div>
      </div>

      {/* Chart 7 hari */}
      <div className="bg-white rounded-3xl p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-stone-700">Pendapatan 7 Hari</p>
          <TrendingUp size={16} className="text-brand-400" />
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={last7} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#E97400" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#E97400" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v) => [fmt(v), 'Pendapatan']}
              contentStyle={{ fontSize: 11, borderRadius: 10, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
            />
            <Area type="monotone" dataKey="total" stroke="#E97400" strokeWidth={2.5} fill="url(#grad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stok rendah warning */}
      {stokRendah.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={15} className="text-red-500" />
            <p className="text-xs font-bold text-red-600">Stok Hampir Habis</p>
          </div>
          <div className="flex flex-col gap-1.5">
            {stokRendah.map(p => (
              <div key={p.id} className="flex justify-between items-center">
                <p className="text-xs text-stone-700 font-medium">{p.name}</p>
                <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                  Sisa {p.stok} {p.satuan}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaksi terakhir */}
      <div className="bg-white rounded-3xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-stone-700">Transaksi Terakhir</p>
          <ShoppingBag size={15} className="text-stone-400" />
        </div>
        <div className="flex flex-col gap-2">
          {transaksi.slice(0, 4).map(t => {
            const items = Array.isArray(t.items) ? t.items : []
            const namaItems = items.map(i => i.nama || i.name || '').join(', ')
            return (
              <div key={t.id} className="flex justify-between items-center py-1.5 border-b border-stone-50 last:border-0">
                <div>
                  <p className="text-xs font-semibold text-stone-700">
                    {namaItems.slice(0, 28)}{namaItems.length > 28 ? '...' : ''}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className="text-xs font-bold text-brand-500 font-mono">{fmt(t.total)}</p>
              </div>
            )
          })}
          {!loading && transaksi.length === 0 && (
            <p className="text-xs text-stone-400 text-center py-4">Belum ada transaksi hari ini</p>
          )}
        </div>
      </div>
    </div>
  )
}