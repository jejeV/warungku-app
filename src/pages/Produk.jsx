import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { Plus, Search, Pencil, Trash2, Package, RefreshCw, X, Check, AlertCircle, Loader2 } from 'lucide-react'

const CATEGORIES = ['Semua', 'Makanan', 'Minuman', 'Sembako', 'Kebersihan', 'Lainnya']

function fmt(n) { return 'Rp ' + Number(n).toLocaleString('id-ID') }

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 bg-stone-200 rounded w-2/3 mb-2" />
          <div className="h-3 bg-stone-100 rounded w-1/4" />
        </div>
        <div className="flex gap-1.5">
          <div className="w-7 h-7 bg-stone-100 rounded-xl" />
          <div className="w-7 h-7 bg-stone-100 rounded-xl" />
          <div className="w-7 h-7 bg-stone-100 rounded-xl" />
        </div>
      </div>
      <div className="flex gap-4 mt-3 pt-3 border-t border-stone-50">
        {[1,2,3,4].map(i => (
          <div key={i}>
            <div className="h-2 bg-stone-100 rounded w-8 mb-1" />
            <div className="h-3 bg-stone-200 rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Product form modal ───────────────────────────────────────────────────────
function ProductForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { name: '', category: 'Makanan', harga: '', modal: '', stok: '', min_stok: 5, satuan: 'pcs' }
  )
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { setErr('Nama produk wajib diisi'); return }
    if (!form.harga || +form.harga <= 0) { setErr('Harga jual wajib diisi'); return }
    setSaving(true)
    setErr(null)
    const { error } = await onSave({
      ...form,
      harga: +form.harga,
      modal: +form.modal || 0,
      stok: +form.stok || 0,
      min_stok: +form.min_stok || 5,
    })
    setSaving(false)
    if (error) setErr('Gagal menyimpan. Coba lagi.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white w-full max-w-[390px] rounded-t-3xl p-5 pb-8 slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-stone-800">{initial ? 'Edit Produk' : 'Tambah Produk'}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-full bg-stone-100"><X size={16} /></button>
        </div>
        <div className="flex flex-col gap-3">
          <input className="inp" placeholder="Nama produk *" value={form.name} onChange={e => set('name', e.target.value)} />
          <select className="inp" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.filter(c => c !== 'Semua').map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-stone-400 font-semibold ml-1">Harga Jual *</label>
              <input className="inp" type="number" placeholder="Rp" value={form.harga} onChange={e => set('harga', e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 font-semibold ml-1">Harga Modal</label>
              <input className="inp" type="number" placeholder="Rp" value={form.modal} onChange={e => set('modal', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-stone-400 font-semibold ml-1">Stok Awal</label>
              <input className="inp" type="number" placeholder="0" value={form.stok} onChange={e => set('stok', e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 font-semibold ml-1">Min. Stok</label>
              <input className="inp" type="number" placeholder="5" value={form.min_stok} onChange={e => set('min_stok', e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 font-semibold ml-1">Satuan</label>
              <input className="inp" placeholder="pcs" value={form.satuan} onChange={e => set('satuan', e.target.value)} />
            </div>
          </div>
        </div>

        {err && (
          <div className="flex items-center gap-2 mt-3 bg-red-50 border border-red-100 rounded-2xl px-3 py-2.5">
            <AlertCircle size={13} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-600 font-medium">{err}</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 w-full py-3 bg-brand-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={16} />}
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
      <style>{`.inp{border:1.5px solid #e7e5e4;border-radius:12px;padding:8px 12px;font-size:13px;width:100%;outline:none;font-family:inherit;transition:border-color .2s}.inp:focus{border-color:#E97400}`}</style>
    </div>
  )
}

// ─── Restock modal ────────────────────────────────────────────────────────────
function RestockModal({ product, onSave, onCancel }) {
  const [jumlah, setJumlah]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState(null)

  const handleSave = async () => {
    if (!jumlah || +jumlah <= 0) return
    setSaving(true)
    setErr(null)
    const { error } = await onSave(+jumlah)
    setSaving(false)
    if (error) setErr('Gagal menyimpan. Coba lagi.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white w-full max-w-[390px] rounded-t-3xl p-5 pb-8 slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-stone-800">Tambah Stok</h3>
          <button onClick={onCancel} className="p-1.5 rounded-full bg-stone-100"><X size={16} /></button>
        </div>
        <p className="text-xs text-stone-500 mb-3">
          Produk: <span className="font-bold text-stone-700">{product.name}</span> —
          Stok sekarang: <span className="font-bold text-brand-500">{product.stok} {product.satuan}</span>
        </p>
        <input
          className="w-full border-2 border-stone-200 focus:border-brand-400 rounded-2xl px-4 py-3 text-lg font-bold font-mono text-center outline-none"
          type="number" placeholder="Jumlah tambahan"
          value={jumlah} onChange={e => setJumlah(e.target.value)}
        />
        {err && (
          <div className="flex items-center gap-2 mt-3 bg-red-50 border border-red-100 rounded-2xl px-3 py-2.5">
            <AlertCircle size={13} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-600 font-medium">{err}</p>
          </div>
        )}
        <button
          className="mt-4 w-full py-3 bg-brand-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          onClick={handleSave}
          disabled={saving || !jumlah || +jumlah <= 0}
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : null}
          {saving ? 'Menyimpan...' : `Tambah ${jumlah ? jumlah + ' ' + product.satuan : ''}`}
        </button>
      </div>
    </div>
  )
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────
function DeleteConfirm({ product, onConfirm, onCancel }) {
  const [deleting, setDeleting] = useState(false)
  const [err, setErr] = useState(null)

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await onConfirm()
    setDeleting(false)
    if (error) setErr('Gagal menghapus. Coba lagi.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white w-full max-w-[390px] rounded-t-3xl p-5 pb-8 slide-up">
        <h3 className="font-bold text-stone-800 mb-2">Hapus Produk?</h3>
        <p className="text-sm text-stone-500 mb-5">
          <span className="font-semibold text-stone-700">{product.name}</span> akan dihapus permanen dan tidak bisa dikembalikan.
        </p>
        {err && (
          <div className="flex items-center gap-2 mb-3 bg-red-50 border border-red-100 rounded-2xl px-3 py-2.5">
            <AlertCircle size={13} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-600 font-medium">{err}</p>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl font-bold text-sm bg-stone-100 text-stone-600">Batal</button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-3 rounded-2xl font-bold text-sm bg-red-500 text-white flex items-center justify-center gap-2 disabled:opacity-60">
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Produk ──────────────────────────────────────────────────────────────
export default function Produk() {
  const { products, loading, addProduct, updateProduct, deleteProduct, restockProduct } = useStore()
  const [search, setSearch]           = useState('')
  const [cat, setCat]                 = useState('Semua')
  const [formOpen, setFormOpen]       = useState(false)
  const [editTarget, setEditTarget]   = useState(null)
  const [restockTarget, setRestockTarget] = useState(null)
  const [deleteTarget, setDeleteTarget]   = useState(null)

  const filtered = products.filter(p => {
    const matchCat    = cat === 'Semua' || p.category === cat
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
          onClick={() => { setEditTarget(null); setFormOpen(true) }}
          className="flex items-center gap-1.5 bg-brand-500 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-md shadow-brand-200">
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
          <button key={c} onClick={() => setCat(c)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
              ${cat === c ? 'bg-brand-500 text-white' : 'bg-white text-stone-500 border border-stone-100'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Product list */}
      <div className="flex flex-col gap-2.5">
        {loading
          ? [1,2,3].map(i => <SkeletonCard key={i} />)
          : filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-800">{p.name}</span>
                    {p.stok <= p.min_stok && (
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
                  <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100">
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
                  <p className={`text-xs font-bold font-mono ${p.stok <= p.min_stok ? 'text-red-500' : 'text-stone-700'}`}>
                    {p.stok} {p.satuan}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-stone-400 uppercase font-semibold">Laba/unit</p>
                  <p className="text-xs font-bold text-green-600 font-mono">{fmt(p.harga - p.modal)}</p>
                </div>
              </div>
            </div>
          ))
        }

        {!loading && filtered.length === 0 && (
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
          onSave={async (data) => {
            let result
            if (editTarget) result = await updateProduct(editTarget.id, data)
            else result = await addProduct(data)
            if (!result?.error) setFormOpen(false)
            return result || {}
          }}
          onCancel={() => setFormOpen(false)}
        />
      )}

      {/* Restock modal */}
      {restockTarget && (
        <RestockModal
          product={restockTarget}
          onSave={async (jumlah) => {
            const result = await restockProduct(restockTarget.id, jumlah)
            if (!result?.error) setRestockTarget(null)
            return result || {}
          }}
          onCancel={() => setRestockTarget(null)}
        />
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteConfirm
          product={deleteTarget}
          onConfirm={async () => {
            const result = await deleteProduct(deleteTarget.id)
            if (!result?.error) setDeleteTarget(null)
            return result || {}
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}