import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { ShoppingCart, Plus, Minus, Trash2, Check, X } from 'lucide-react'

function fmt(n) { return 'Rp ' + Number(n).toLocaleString('id-ID') }

export default function Kasir() {
  const { products, addTransaksi } = useStore()
  const [cart, setCart] = useState([])
  const [bayar, setBayar] = useState('')
  const [sukses, setSukses] = useState(null)
  const [search, setSearch] = useState('')

  const addToCart = (p) => {
    if (p.stok <= 0) return
    setCart(prev => {
      const existing = prev.find(c => c.productId === p.id)
      if (existing) {
        if (existing.qty >= p.stok) return prev
        return prev.map(c => c.productId === p.id ? { ...c, qty: c.qty + 1 } : c)
      }
      return [...prev, { productId: p.id, nama: p.name, harga: p.harga, qty: 1, satuan: p.satuan }]
    })
  }

  const changeQty = (productId, delta) => {
    setCart(prev => prev
      .map(c => c.productId === productId ? { ...c, qty: c.qty + delta } : c)
      .filter(c => c.qty > 0)
    )
  }

  const total = cart.reduce((s, c) => s + c.harga * c.qty, 0)
  const kembalian = +bayar - total

  const bayarAngka = [5000, 10000, 20000, 50000, 100000]

  const proses = () => {
    if (cart.length === 0 || +bayar < total) return
    const t = addTransaksi({ items: cart, total, bayar: +bayar, kembalian })
    setSukses({ ...t, kembalian })
    setCart([])
    setBayar('')
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  if (sukses) return (
    <div className="h-full flex flex-col items-center justify-center px-6 slide-up">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <Check size={36} className="text-green-500" />
      </div>
      <h2 className="text-xl font-extrabold text-stone-800 mb-1">Transaksi Berhasil!</h2>
      <p className="text-sm text-stone-500 mb-6">Kembalian untuk pelanggan</p>
      <div className="bg-white rounded-3xl p-6 w-full shadow-sm text-center mb-6">
        <p className="text-xs text-stone-400 mb-1">Kembalian</p>
        <p className="text-4xl font-extrabold text-brand-500 font-mono">{fmt(sukses.kembalian)}</p>
        <p className="text-xs text-stone-400 mt-3">Total: {fmt(sukses.total)} · Bayar: {fmt(sukses.bayar)}</p>
      </div>
      <button
        className="w-full py-3 bg-brand-500 text-white rounded-2xl font-bold"
        onClick={() => setSukses(null)}
      >
        Transaksi Baru
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full px-5 pb-4 slide-up">
      <div className="pt-6 pb-3">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Point of Sale</p>
        <h1 className="text-xl font-extrabold text-stone-800">Kasir</h1>
      </div>

      {/* Search produk */}
      <input
        className="w-full bg-white rounded-2xl py-2.5 px-4 text-sm outline-none border border-stone-100 shadow-sm mb-3"
        placeholder="Cari produk..."
        value={search} onChange={e => setSearch(e.target.value)}
      />

      {/* Produk grid */}
      <div className="grid grid-cols-2 gap-2 mb-4 overflow-y-auto no-scrollbar" style={{ maxHeight: '240px' }}>
        {filtered.map(p => {
          const inCart = cart.find(c => c.productId === p.id)
          return (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stok === 0}
              className={`bg-white rounded-2xl p-3 text-left shadow-sm border-2 transition-all
                ${inCart ? 'border-brand-400' : 'border-transparent'}
                ${p.stok === 0 ? 'opacity-40' : 'active:scale-95'}`}
            >
              <p className="text-xs font-bold text-stone-800 leading-tight">{p.name}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">{p.category}</p>
              <div className="flex justify-between items-end mt-2">
                <p className="text-xs font-extrabold text-brand-500 font-mono">{fmt(p.harga)}</p>
                <p className="text-[10px] text-stone-400">{p.stok} {p.satuan}</p>
              </div>
              {inCart && (
                <div className="mt-1.5 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full inline-block">
                  {inCart.qty} dalam keranjang
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="bg-white rounded-3xl p-4 shadow-sm mb-3">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart size={14} className="text-brand-500" />
            <p className="text-xs font-bold text-stone-700">Keranjang ({cart.length} item)</p>
          </div>
          <div className="flex flex-col gap-2 max-h-32 overflow-y-auto no-scrollbar">
            {cart.map(item => (
              <div key={item.productId} className="flex items-center gap-2">
                <p className="text-xs text-stone-700 flex-1 leading-tight">{item.nama}</p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => changeQty(item.productId, -1)} className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center">
                    <Minus size={10} />
                  </button>
                  <span className="text-xs font-bold w-5 text-center">{item.qty}</span>
                  <button onClick={() => changeQty(item.productId, 1)} className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                    <Plus size={10} />
                  </button>
                </div>
                <p className="text-xs font-bold text-brand-500 font-mono w-16 text-right">{fmt(item.harga * item.qty)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-stone-100 mt-3 pt-3 flex justify-between">
            <p className="text-sm font-extrabold text-stone-800">Total</p>
            <p className="text-sm font-extrabold text-brand-500 font-mono">{fmt(total)}</p>
          </div>
        </div>
      )}

      {/* Bayar */}
      {cart.length > 0 && (
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs font-bold text-stone-600 mb-2">Nominal Bayar</p>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {bayarAngka.map(n => (
              <button key={n} onClick={() => setBayar(String(n))}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all
                  ${+bayar === n ? 'bg-brand-500 text-white border-brand-500' : 'border-stone-200 text-stone-600'}`}>
                {fmt(n)}
              </button>
            ))}
          </div>
          <input
            className="w-full border-2 border-stone-200 focus:border-brand-400 rounded-2xl px-4 py-2 text-sm font-mono font-bold outline-none mb-3"
            type="number" placeholder="Nominal lain..."
            value={bayar} onChange={e => setBayar(e.target.value)}
          />
          {+bayar > 0 && (
            <div className={`text-xs font-bold text-center mb-3 ${kembalian < 0 ? 'text-red-500' : 'text-green-600'}`}>
              {kembalian < 0 ? `Kurang ${fmt(Math.abs(kembalian))}` : `Kembalian ${fmt(kembalian)}`}
            </div>
          )}
          <button
            className={`w-full py-3 rounded-2xl font-bold text-sm transition-all
              ${+bayar >= total && cart.length > 0 ? 'bg-brand-500 text-white shadow-md shadow-brand-200' : 'bg-stone-100 text-stone-400'}`}
            onClick={proses}
          >
            Proses Pembayaran
          </button>
        </div>
      )}

      {cart.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-stone-300 pb-10">
          <ShoppingCart size={40} className="mb-2" />
          <p className="text-sm">Pilih produk untuk mulai</p>
        </div>
      )}
    </div>
  )
}
