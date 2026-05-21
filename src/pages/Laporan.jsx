import { useState, useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { FileText, Sheet, Loader2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { exportLaporanPDF } from '../utils/exportPDF'
import { exportLaporanExcel } from '../utils/exportExcel'

function fmt(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID') }

const COLORS = ['#E97400', '#FF8F0F', '#FFAA42', '#FFC985', '#FFE6C7', '#7C3AED']

// ─── Mode filter ──────────────────────────────────────────────────────────────
// mode: 'preset' | 'custom'
// preset: '7' | '14' | '30'
// custom: { from: Date, to: Date }

function isSameLocalDay(isoString, targetDate) {
  const d = new Date(isoString)
  return (
    d.getFullYear() === targetDate.getFullYear() &&
    d.getMonth()    === targetDate.getMonth() &&
    d.getDate()     === targetDate.getDate()
  )
}

// Format tanggal untuk input[type=date] value: YYYY-MM-DD
function toInputDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function fromInputDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

// Label ringkas untuk range custom
function rangeLabel(from, to) {
  const opts = { day: 'numeric', month: 'short' }
  return `${from.toLocaleDateString('id-ID', opts)} – ${to.toLocaleDateString('id-ID', opts)}`
}

// ─── Date picker modal ────────────────────────────────────────────────────────
function DateRangePicker({ from, to, onChange, onClose }) {
  const [draft, setDraft] = useState({ from: toInputDate(from), to: toInputDate(to) })

  const apply = () => {
    const f = fromInputDate(draft.from)
    const t = fromInputDate(draft.to)
    if (f > t) return
    onChange(f, t)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white w-full max-w-[390px] rounded-t-3xl p-5 pb-8 slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-stone-800">Pilih Rentang Tanggal</h3>
          <button onClick={onClose} className="text-stone-400 text-xs font-semibold">Batal</button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] text-stone-400 font-semibold uppercase tracking-wide block mb-1.5 ml-1">Dari</label>
            <input
              type="date"
              max={draft.to}
              value={draft.from}
              onChange={e => setDraft(d => ({ ...d, from: e.target.value }))}
              className="w-full border-2 border-stone-200 focus:border-brand-400 rounded-2xl px-3 py-2.5 text-sm font-semibold outline-none text-stone-700"
            />
          </div>
          <div>
            <label className="text-[10px] text-stone-400 font-semibold uppercase tracking-wide block mb-1.5 ml-1">Sampai</label>
            <input
              type="date"
              min={draft.from}
              max={toInputDate(new Date())}
              value={draft.to}
              onChange={e => setDraft(d => ({ ...d, to: e.target.value }))}
              className="w-full border-2 border-stone-200 focus:border-brand-400 rounded-2xl px-3 py-2.5 text-sm font-semibold outline-none text-stone-700"
            />
          </div>
        </div>
        {/* Shortcut buttons */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { label: 'Hari ini', fn: () => { const t = toInputDate(new Date()); setDraft({ from: t, to: t }) } },
            { label: 'Minggu ini', fn: () => {
              const now = new Date(); const day = now.getDay()
              const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1)); mon.setHours(0,0,0,0)
              setDraft({ from: toInputDate(mon), to: toInputDate(now) })
            }},
            { label: 'Bulan ini', fn: () => {
              const now = new Date()
              const first = new Date(now.getFullYear(), now.getMonth(), 1)
              setDraft({ from: toInputDate(first), to: toInputDate(now) })
            }},
          ].map(({ label, fn }) => (
            <button key={label} onClick={fn}
              className="text-xs px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 font-semibold bg-stone-50 active:bg-stone-100">
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={apply}
          className="w-full py-3 bg-brand-500 text-white rounded-2xl font-bold text-sm"
        >
          Terapkan
        </button>
      </div>
    </div>
  )
}

// ─── Main Laporan ─────────────────────────────────────────────────────────────
export default function Laporan() {
  const { transaksi, products } = useStore()
  const [exporting, setExporting] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [txLimit, setTxLimit] = useState(10)

  // Filter mode
  const [filterMode, setFilterMode] = useState('preset') // 'preset' | 'custom'
  const [preset, setPreset] = useState('7')
  const [customFrom, setCustomFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 6); d.setHours(0,0,0,0); return d })
  const [customTo, setCustomTo]     = useState(() => { const d = new Date(); d.setHours(23,59,59,999); return d })

  // ── Compute filtered transaksi ────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (filterMode === 'preset') {
      const days = parseInt(preset)
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - (days - 1)); cutoff.setHours(0,0,0,0)
      return transaksi.filter(t => new Date(t.created_at) >= cutoff)
    }
    // custom range — to akhir hari
    const toEnd = new Date(customTo); toEnd.setHours(23,59,59,999)
    return transaksi.filter(t => {
      const d = new Date(t.created_at)
      return d >= customFrom && d <= toEnd
    })
  }, [transaksi, filterMode, preset, customFrom, customTo])

  // ── Chart data ────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (filterMode === 'preset') {
      const days = parseInt(preset)
      return Array.from({ length: days }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (days - 1 - i)); d.setHours(0,0,0,0)
        const label = days <= 7
          ? d.toLocaleDateString('id-ID', { weekday: 'short' })
          : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        const total = filtered
          .filter(t => isSameLocalDay(t.created_at, d))
          .reduce((s, t) => s + (t.total || 0), 0)
        return { label, total }
      })
    }
    // custom: satu bar per hari di range
    const days = []
    const cur = new Date(customFrom); cur.setHours(0,0,0,0)
    const end = new Date(customTo);   end.setHours(0,0,0,0)
    while (cur <= end) {
      const d = new Date(cur)
      const diffDays = Math.round((new Date(customTo) - new Date(customFrom)) / 86400000)
      const label = diffDays <= 7
        ? d.toLocaleDateString('id-ID', { weekday: 'short' })
        : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      const total = filtered
        .filter(t => isSameLocalDay(t.created_at, d))
        .reduce((s, t) => s + (t.total || 0), 0)
      days.push({ label, total })
      cur.setDate(cur.getDate() + 1)
    }
    return days
  }, [filtered, filterMode, preset, customFrom, customTo])

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalPendapatan = filtered.reduce((s, t) => s + (t.total || 0), 0)
  const totalTransaksi  = filtered.length
  const totalLaba = filtered.reduce((s, t) => {
    const items = Array.isArray(t.items) ? t.items : []
    return s + items.reduce((ss, item) => {
      const p = products.find(p => p.id === item.productId)
      return ss + (p ? (p.harga - p.modal) * (item.qty || 1) : 0)
    }, 0)
  }, 0)

  // ── Produk terlaris ───────────────────────────────────────────────────────
  const terlaris = useMemo(() => {
    const sales = {}
    filtered.forEach(t => {
      const items = Array.isArray(t.items) ? t.items : []
      items.forEach(item => {
        const nama = item.nama || item.name || 'Produk'
        sales[nama] = (sales[nama] || 0) + (item.qty || 1)
      })
    })
    return Object.entries(sales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nama, qty]) => ({ nama, qty }))
  }, [filtered])

  // ── Export ────────────────────────────────────────────────────────────────
  const periodeLabel = filterMode === 'preset'
    ? { '7': '7 Hari', '14': '14 Hari', '30': '30 Hari' }[preset]
    : rangeLabel(customFrom, customTo)

  const handleExport = async (type) => {
    setExporting(type)
    await new Promise(r => setTimeout(r, 80))
    const payload = { transaksi: filtered, products, periode: periodeLabel, totalPendapatan, totalLaba }
    try {
      if (type === 'pdf')   exportLaporanPDF(payload)
      if (type === 'excel') exportLaporanExcel(payload)
    } finally {
      setExporting(null)
    }
  }

  // ── Navigasi custom range: geser range ────────────────────────────────────
  const shiftRange = (dir) => {
    const diff = customTo - customFrom
    setCustomFrom(new Date(customFrom.getTime() + dir * (diff + 86400000)))
    setCustomTo(new Date(customTo.getTime()   + dir * (diff + 86400000)))
  }

  return (
    <div className="px-5 pb-4 slide-up">
      <div className="pt-6 pb-4">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Analitik</p>
        <h1 className="text-xl font-extrabold text-stone-800">Laporan</h1>
      </div>

      {/* Export buttons */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => handleExport('pdf')} disabled={!!exporting || filtered.length === 0}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-red-100 bg-red-50 text-red-500 font-bold text-xs transition-all active:scale-95 disabled:opacity-40">
          {exporting === 'pdf' ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
          Export PDF
        </button>
        <button onClick={() => handleExport('excel')} disabled={!!exporting || filtered.length === 0}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-green-100 bg-green-50 text-green-600 font-bold text-xs transition-all active:scale-95 disabled:opacity-40">
          {exporting === 'excel' ? <Loader2 size={13} className="animate-spin" /> : <Sheet size={13} />}
          Export Excel
        </button>
      </div>

      {/* ── Filter periode ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-1 shadow-sm mb-3 flex gap-1">
        {[['7', '7 Hari'], ['14', '14 Hari'], ['30', '30 Hari']].map(([v, l]) => (
          <button key={v}
            onClick={() => { setFilterMode('preset'); setPreset(v); setTxLimit(10) }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all
              ${filterMode === 'preset' && preset === v ? 'bg-brand-500 text-white' : 'text-stone-500'}`}>
            {l}
          </button>
        ))}
        <button
          onClick={() => setShowPicker(true)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all
            ${filterMode === 'custom' ? 'bg-brand-500 text-white' : 'text-stone-500'}`}>
          <Calendar size={11} />
          {filterMode === 'custom' ? rangeLabel(customFrom, customTo) : 'Custom'}
        </button>
      </div>

      {/* Navigasi geser range custom */}
      {filterMode === 'custom' && (
        <div className="flex items-center justify-between mb-3 px-1">
          <button onClick={() => shiftRange(-1)} className="flex items-center gap-1 text-xs text-stone-500 font-semibold active:text-brand-500">
            <ChevronLeft size={14} /> Sebelumnya
          </button>
          <p className="text-xs text-stone-400">{rangeLabel(customFrom, customTo)}</p>
          <button
            onClick={() => shiftRange(1)}
            disabled={customTo >= new Date()}
            className="flex items-center gap-1 text-xs text-stone-500 font-semibold active:text-brand-500 disabled:opacity-30">
            Berikutnya <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Pendapatan', value: fmt(totalPendapatan), color: 'text-brand-500' },
          { label: 'Transaksi',  value: totalTransaksi + 'x',  color: 'text-blue-500' },
          { label: 'Est. Laba',  value: fmt(totalLaba),         color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-3 shadow-sm">
            <p className="text-[9px] text-stone-400 uppercase font-semibold">{label}</p>
            <p className={`text-xs font-extrabold ${color} font-mono mt-0.5 leading-tight`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-3xl p-4 shadow-sm mb-4">
        <p className="text-xs font-bold text-stone-700 mb-3">Pendapatan Harian</p>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
        <p className="text-xs font-bold text-stone-700 mb-3">
          Riwayat Transaksi
          <span className="ml-1.5 text-stone-400 font-normal">({filtered.length})</span>
        </p>
        <div className="flex flex-col gap-2">
          {filtered.slice(0, txLimit).map(t => {
            const items = Array.isArray(t.items) ? t.items : []
            const namaItems = items.map(i => i.nama || i.name || '').join(', ')
            return (
              <div key={t.id} className="flex justify-between items-start py-2 border-b border-stone-50 last:border-0">
                <div>
                  <p className="text-xs font-semibold text-stone-700">
                    {namaItems.slice(0, 30)}{namaItems.length > 30 ? '...' : ''}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ·{' '}
                    {new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className="text-xs font-bold text-brand-500 font-mono">{fmt(t.total)}</p>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-stone-400 text-center py-4">Belum ada transaksi di periode ini</p>
          )}
        </div>
        {/* Load more */}
        {filtered.length > txLimit && (
          <button
            onClick={() => setTxLimit(l => l + 20)}
            className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-brand-500 bg-brand-50 active:bg-brand-100 transition-all">
            Tampilkan lebih banyak ({filtered.length - txLimit} lagi)
          </button>
        )}
      </div>

      {/* Date range picker modal */}
      {showPicker && (
        <DateRangePicker
          from={customFrom}
          to={customTo}
          onChange={(f, t) => { setCustomFrom(f); setCustomTo(t); setFilterMode('custom'); setTxLimit(10) }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}