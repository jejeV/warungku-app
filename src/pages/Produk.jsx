import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { Plus, Search, Pencil, Trash2, Package, RefreshCw, X, Check } from 'lucide-react'

const CATEGORIES = ['Semua', 'Makanan', 'Minuman', 'Sembako', 'Kebersihan', 'Lainnya']

function fmt(n) { return 'Rp ' + Number(n).toLocaleString('id-ID') }

function ProductForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name: '', category: 'Makanan', harga: '', modal: '', stok: '', minStok: 5, satuan: 'pcs' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white w-full max-w-[390px] rounded-t-3xl p-5 pb-8 slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-stone-800">{initial ? 'Edit Produk' : 'Tambah Produk'}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-full bg-stone-100"><X size={16} /></button>
        </div>
        <div className="flex flex-col gap-3">
          <input className="input" placeholder="Nama produk" value={form.name} onChange={e => set('name', e.target.value)} />
          <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.filter(c => c !== 'Semua').map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-stone-400 font-semibold ml-1">Harga Jual</label>
              <input className="input" type="number" placeholder="Rp" value={form.harga} onChange={e => set('harga', e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 font-semibold ml-1">Harga Modal</label>
              <input className="input" type="number" placeholder="Rp" value={form.modal} onChange={e => set('modal', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-stone-400 font-semibold ml-1">Stok Awal</label>
              <input className="input" type="number" placeholder="0" value={form.stok} onChange={e => set('stok', e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 font-semibold ml-1">Min. Stok</label>
              <input className="input" type="number" placeholder="5" value={form.minStok} onChange={e => set('minStok', e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 font-semibold ml-1">Satuan</label>
              <input className="input" placeholder="pcs" value={form.satuan} onChange={e => set('satuan', e.target.value)} />
            </div>
          </div>
        </div>
        <button
          className="mt-4 w-full py-3 bg-brand-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
          onClick={() => onSave({ ...form, harga: +form.harga, modal: +form.modal, stok: +form.stok, minStok: +form.minStok })}
        >
          <Check size={16} /> Simpan
        </button>
      </div>
      <style>{`.input { border: 1.5px solid #e7e5e4; border-radius: 12px; padding: 8px 12px; font-size: 13px; width: 100%; outline: none; font-family: inherit; transition: border-color 0.2s; }
      .input:focus { border-color: #E97400; }`}</style>
    </div>
  )
}

function RestockModal({ product, onSave, onCancel }) {
  const [jumlah, setJumlah] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white w-full max-w-[390px] rounded-t-3xl p-5 pb-8 slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-stone-800">Tambah Stok</h3>
          <button onClick={onCancel} className="p-1.5 rounded-full bg-stone-100"><X size={16} /></button>
        </div>
        <p className="text-xs text-stone-500 mb-3">Produk: <span className="font-bold text-stone-700">{product.name}</span> — Stok sekarang: <span className="font-bold text-brand-500">{product.stok} {product.satuan}</span></p>
        <input
          className="w-full border-2 border-stone-200 focus:border-brand-400 rounded-2xl px-4 py-3 text-lg font-bold font-mono text-center outline-none"
          type="number" placeholder="Jumlah tambahan"
          value={jumlah} onChange={e => setJumlah(e.target.value)}
        />
        <button
          className="mt-4 w-full py-3 bg-brand-500 text-white rounded-2xl font-bold text-sm"
          onClick={() => jumlah > 0 && onSave(+jumlah)}
        >
          Tambah {jumlah ? jumlah + ' ' + product.satuan : ''}
        </button>
      </div>
    </div>
  )
}

export default function Produk() {
  const { products, addProduct, updateProduct, deleteProduct, restockProduct } = useStore()
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('Semua')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [restockTarget, setRestockTarget] = useState(null)

  const filtered = products.filter(p => {
    const matchCat = cat === 'Semua' || p.category === cat
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="px-5 pb-4 slide-up">
      {/* Header */}
      <div className="pt-6 pb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Manajemen</p>
          <h1 className="text-xl font-extrabold text-stone-800">Produk</h1>
        </div>
        <button
          className="flex items-center gap-1.5 bg-brand-500 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-md shadow-brand-200"
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
        >
          <Plus size={14} /> Tambah
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          className="w-full bg-white rounded-2xl py-2.5 pl-9 pr-4 text-sm outline-none border border-stone-100 shadow-sm"
          placeholder="Cari produk..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        {CATEGORIES.map(c => (
          <button key={c}
            onClick={() => setCat(c)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${cat === c ? 'bg-brand-500 text-white' : 'bg-white text-stone-500 border border-stone-100'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Product list */}
      <div className="flex flex-col gap-2.5">
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-800">{p.name}</span>
                  {p.stok <= p.minStok && (
                    <span className="text-[9px] bg-red-100 text-red-500 font-bold px-1.5 py-0.5 rounded-full">LOW</span>
                  )}
                </div>
                <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full mt-1 inline-block">{p.category}</span>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setRestockTarget(p)} className="p-1.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-100">
                  <RefreshCw size={13} />
                </button>
                <button onClick={() => { setEditTarget(p); setFormOpen(true) }} className="p-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100">
                  <Pencil size={13} />
                </button>
                <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-stone-50">
              <div>
                <p className="text-[9px] text-stone-400 uppercase font-semibold">Harga</p>
                <p className="text-xs font-bold text-brand-500 font-mono">{fmt(p.harga)}</p>
              </div>
              <div>
                <p className="text-[9px] text-stone-400 uppercase font-semibold">Modal</p>
                <p className="text-xs font-bold text-stone-600 font-mono">{fmt(p.modal)}</p>
              </div>
              <div>
                <p className="text-[9px] text-stone-400 uppercase font-semibold">Stok</p>
                <p className={`text-xs font-bold font-mono ${p.stok <= p.minStok ? 'text-red-500' : 'text-stone-700'}`}>{p.stok} {p.satuan}</p>
              </div>
              <div>
                <p className="text-[9px] text-stone-400 uppercase font-semibold">Laba/unit</p>
                <p className="text-xs font-bold text-green-600 font-mono">{fmt(p.harga - p.modal)}</p>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-stone-400">
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Produk tidak ditemukan</p>
          </div>
        )}
      </div>

      {/* Form modal */}
      {formOpen && (
        <ProductForm
          initial={editTarget}
          onSave={(data) => {
            if (editTarget) updateProduct(editTarget.id, data)
            else addProduct(data)
            setFormOpen(false)
          }}
          onCancel={() => setFormOpen(false)}
        />
      )}

      {/* Restock modal */}
      {restockTarget && (
        <RestockModal
          product={restockTarget}
          onSave={(jumlah) => { restockProduct(restockTarget.id, jumlah); setRestockTarget(null) }}
          onCancel={() => setRestockTarget(null)}
        />
      )}
    </div>
  )
}
