import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const StoreContext = createContext(null)

// Helper timezone-safe
function isSameLocalDay(isoString, targetDate) {
  const d = new Date(isoString)
  return (
    d.getFullYear() === targetDate.getFullYear() &&
    d.getMonth()    === targetDate.getMonth() &&
    d.getDate()     === targetDate.getDate()
  )
}

export function StoreProvider({ children }) {
  const { user } = useAuth()

  const [store, setStore]         = useState(null)
  const [products, setProducts]   = useState([])
  const [transaksi, setTransaksi] = useState([])
  const [loading, setLoading]     = useState(true)

  const loadStore = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', user.id)
      .single()
    setStore(data ?? null)
  }, [user])

  const loadProducts = useCallback(async () => {
    if (!store) return
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', store.id)
      .order('name')
    setProducts(data ?? [])
  }, [store])

  const loadTransaksi = useCallback(async () => {
    if (!store) return
    const { data } = await supabase
      .from('transaksi')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(100)
    setTransaksi(data ?? [])
  }, [store])

  // ─── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    setLoading(true)
    loadStore().finally(() => setLoading(false))
  }, [user, loadStore])

  useEffect(() => {
    if (!store) return
    loadProducts()
    loadTransaksi()
  }, [store, loadProducts, loadTransaksi])

  // ─── Realtime subscriptions ─────────────────────────────────────────────────
  useEffect(() => {
    if (!store) return

    // Produk realtime — sync stok dari device lain
    const prodChannel = supabase
      .channel(`products:${store.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `store_id=eq.${store.id}`,
      }, ({ eventType, new: newRow, old: oldRow }) => {
        if (eventType === 'INSERT')
          setProducts(prev => [...prev, newRow].sort((a, b) => a.name.localeCompare(b.name)))
        if (eventType === 'UPDATE')
          setProducts(prev => prev.map(p => p.id === newRow.id ? newRow : p))
        if (eventType === 'DELETE')
          setProducts(prev => prev.filter(p => p.id !== oldRow.id))
      })
      .subscribe()

    // Transaksi realtime — update dashboard saat transaksi masuk
    const txChannel = supabase
      .channel(`transaksi:${store.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transaksi',
        filter: `store_id=eq.${store.id}`,
      }, ({ new: newRow }) => {
        setTransaksi(prev => {
          // Hindari duplikat (transaksi dari device ini sudah di-optimistic update)
          if (prev.some(t => t.id === newRow.id)) return prev
          return [newRow, ...prev]
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(prodChannel)
      supabase.removeChannel(txChannel)
    }
  }, [store])

  // ─── CRUD Products ──────────────────────────────────────────────────────────
  const addProduct = async (p) => {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...p, store_id: store.id })
      .select()
      .single()
    if (!error) setProducts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return { data, error }
  }

  const updateProduct = async (id, updates) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error) setProducts(prev => prev.map(p => p.id === id ? data : p))
    return { data, error }
  }

  const deleteProduct = async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) setProducts(prev => prev.filter(p => p.id !== id))
    return { error }
  }

  const restockProduct = async (id, jumlah) => {
    const product = products.find(p => p.id === id)
    if (!product) return
    return updateProduct(id, { stok: product.stok + jumlah })
  }

  // ─── Transaksi ──────────────────────────────────────────────────────────────
  const addTransaksi = async (t) => {
    // Optimistic update — UI langsung update sebelum nunggu response
    const tempId = `temp-${Date.now()}`
    const tempTx = {
      id: tempId,
      store_id: store.id,
      items: t.items,
      total: t.total,
      bayar: t.bayar,
      kembalian: t.kembalian,
      created_at: new Date().toISOString(),
    }
    setTransaksi(prev => [tempTx, ...prev])

    // Optimistic stok update
    const stokSnapshot = {}
    for (const item of t.items) {
      const product = products.find(p => p.id === item.productId)
      if (product) {
        stokSnapshot[item.productId] = product.stok
        const newStok = Math.max(0, product.stok - item.qty)
        setProducts(prev => prev.map(p => p.id === item.productId ? { ...p, stok: newStok } : p))
      }
    }

    // Simpan ke Supabase
    const { data, error } = await supabase
      .from('transaksi')
      .insert({ store_id: store.id, items: t.items, total: t.total, bayar: t.bayar, kembalian: t.kembalian })
      .select()
      .single()

    if (error) {
      // Rollback optimistic update kalau gagal
      setTransaksi(prev => prev.filter(tx => tx.id !== tempId))
      for (const [productId, originalStok] of Object.entries(stokSnapshot)) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, stok: originalStok } : p))
      }
      return { data: null, error }
    }

    // Ganti temp dengan data asli dari Supabase
    setTransaksi(prev => prev.map(tx => tx.id === tempId ? data : tx))

    // Update stok di DB (fire and forget — stok UI sudah diupdate optimistically)
    for (const item of t.items) {
      const product = products.find(p => p.id === item.productId)
      if (product) {
        const newStok = Math.max(0, product.stok - item.qty)
        supabase.from('products').update({ stok: newStok }).eq('id', item.productId)
      }
    }

    return { data, error: null }
  }

  // ─── Computed values ────────────────────────────────────────────────────────
  const today = new Date()
  const pendapatanHariIni = transaksi
    .filter(t => isSameLocalDay(t.created_at, today))
    .reduce((sum, t) => sum + t.total, 0)

  const stokRendah = products.filter(p => p.stok <= p.min_stok)

  return (
    <StoreContext.Provider value={{
      store, products, transaksi, loading,
      addProduct, updateProduct, deleteProduct, restockProduct, addTransaksi,
      pendapatanHariIni, stokRendah,
      reload: () => { loadProducts(); loadTransaksi() },
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)