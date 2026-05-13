import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { FileText, Sheet, Loader2 } from 'lucide-react'
import { exportLaporanPDF } from '../utils/exportPDF'
import { exportLaporanExcel } from '../utils/exportExcel'

function fmt(n) { return 'Rp ' + Number(n).toLocaleString('id-ID') }

const COLORS = ['#E97400', '#FF8F0F', '#FFAA42', '#FFC985', '#FFE6C7', '#7C3AED']

const PERIODE_LABEL = { '7': '7 Hari', '14': '14 Hari', '30': '30 Hari' }

export default function Laporan() {
  const { transaksi, products } = useStore()
  const [periode, setPeriode] = useState('7')
  const [exporting, setExporting] = useState(null) // 'pdf' | 'excel' | null

  const handleExport = async (type) => {
    setExporting(type)
    await new Promise(r => setTimeout(r, 80))
    const payload = { transaksi: filtered, products, periode: PERIODE_LABEL[periode], totalPendapatan, totalLaba }
    try {
      if (type === 'pdf')   exportLaporanPDF(payload)
      if (type === 'excel') exportLaporanExcel(payload)
    } finally {
      setExporting(null)
    }
  }

  const days = parseInt(periode)
  const cutoff = new Date(Date.now() - 86400000 * days)
  const filtered = transaksi.filter(t => new Date(t.tanggal) >= cutoff)

  // Pendapatan per hari
  const perHari = Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const label = days <= 7
      ? d.toLocaleDateString('id-ID', { weekday: 'short' })
      : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    const total = filtered
      .filter(t => new Date(t.tanggal).toDateString() === d.toDateString())
      .reduce((s, t) => s + t.total, 0)
    return { label, total } 
  })

  // Produk terlaris
  const productSales = {}
  filtered.forEach(t => t.items.forEach(item => {
    productSales[item.nama] = (productSales[item.nama] || 0) + item.qty
  }))
  const terlaris = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nama, qty]) => ({ nama, qty }))

  // Summary
  const totalPendapatan = filtered.reduce((s, t) => s + t.total, 0)
  const totalTransaksi = filtered.length
  const totalLaba = filtered.reduce((s, t) => {
    return s + t.items.reduce((ss, item) => {
      const p = products.find(p => p.id === item.productId)
      return ss + (p ? (p.harga - p.modal) * item.qty : 0)
    }, 0)
  }, 0)

  return (
    <div className="px-5 pb-4 slide-up">
      <div className="pt-6 pb-4">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Analitik</p>
        <h1 className="text-xl font-extrabold text-stone-800">Laporan</h1>
      </div>

      {/* Export buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleExport('pdf')}
          disabled={!!exporting || filtered.length === 0}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-red-100 bg-red-50 text-red-500 font-bold text-xs transition-all active:scale-95 disabled:opacity-40"
        >
          {exporting === 'pdf'
            ? <Loader2 size={13} className="animate-spin" />
            : <FileText size={13} />}
          Export PDF
        </button>
        <button
          onClick={() => handleExport('excel')}
          disabled={!!exporting || filtered.length === 0}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-green-100 bg-green-50 text-green-600 font-bold text-xs transition-all active:scale-95 disabled:opacity-40"
        >
          {exporting === 'excel'
            ? <Loader2 size={13} className="animate-spin" />
            : <Sheet size={13} />}
          Export Excel
        </button>
      </div>

      {/* Periode toggle */}
      <div className="flex gap-2 bg-white rounded-2xl p-1 shadow-sm mb-4">
        {[['7', '7 Hari'], ['14', '14 Hari'], ['30', '30 Hari']].map(([v, l]) => (
          <button key={v} onClick={() => setPeriode(v)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all
              ${periode === v ? 'bg-brand-500 text-white' : 'text-stone-500'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Pendapatan', value: fmt(totalPendapatan), color: 'text-brand-500' },
          { label: 'Transaksi', value: totalTransaksi + 'x', color: 'text-blue-500' },
          { label: 'Est. Laba', value: fmt(totalLaba), color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-3 shadow-sm">
            <p className="text-[9px] text-stone-400 uppercase font-semibold">{label}</p>
            <p className={`text-xs font-extrabold ${color} font-mono mt-0.5 leading-tight`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Bar chart pendapatan */}
      <div className="bg-white rounded-3xl p-4 shadow-sm mb-4">
        <p className="text-xs font-bold text-stone-700 mb-3">Pendapatan Harian</p>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={perHari} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#a8a29e' }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? (v / 1000) + 'k' : v} />
            <Tooltip
              formatter={(v) => [fmt(v), 'Pendapatan']}
              contentStyle={{ fontSize: 11, borderRadius: 10, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="total" fill="#E97400" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Produk terlaris */}
      {terlaris.length > 0 && (
        <div className="bg-white rounded-3xl p-4 shadow-sm mb-4">
          <p className="text-xs font-bold text-stone-700 mb-3">Produk Terlaris</p>
          <div className="flex gap-4 items-center">
            <PieChart width={100} height={100}>
              <Pie data={terlaris} dataKey="qty" nameKey="nama" cx="50%" cy="50%" outerRadius={45} innerRadius={25}>
                {terlaris.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
            </PieChart>
            <div className="flex-1 flex flex-col gap-1.5">
              {terlaris.map((item, i) => (
                <div key={item.nama} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <p className="text-[11px] text-stone-600 leading-tight">{item.nama}</p>
                  </div>
                  <p className="text-[11px] font-bold text-stone-700">{item.qty} terjual</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Riwayat transaksi */}
      <div className="bg-white rounded-3xl p-4 shadow-sm">
        <p className="text-xs font-bold text-stone-700 mb-3">Riwayat Transaksi</p>
        <div className="flex flex-col gap-2">
          {filtered.slice(0, 10).map(t => (
            <div key={t.id} className="flex justify-between items-start py-2 border-b border-stone-50 last:border-0">
              <div>
                <p className="text-xs font-semibold text-stone-700">{t.items.map(i => i.nama).join(', ').slice(0, 30)}{t.items.join('').length > 30 ? '...' : ''}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  {new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ·{' '}
                  {new Date(t.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <p className="text-xs font-bold text-brand-500 font-mono">{fmt(t.total)}</p>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-stone-400 text-center py-4">Belum ada transaksi di periode ini</p>
          )}
        </div>
      </div>
    </div>
  )
}