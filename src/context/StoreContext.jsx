import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const StoreContext = createContext(null)

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

  const addProduct = async (p) => {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...p, store_id: store.id })
      .select()
      .single()
    if (!error) setProducts(prev => [...prev, data])
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

  const addTransaksi = async (t) => {
    const { data, error } = await supabase
      .from('transaksi')
      .insert({ store_id: store.id, items: t.items, total: t.total, bayar: t.bayar, kembalian: t.kembalian })
      .select()
      .single()
    if (error) return { data: null, error }
    setTransaksi(prev => [data, ...prev])
    for (const item of t.items) {
      const product = products.find(p => p.id === item.productId)
      if (product) {
        const newStok = Math.max(0, product.stok - item.qty)
        await supabase.from('products').update({ stok: newStok }).eq('id', item.productId)
        setProducts(prev => prev.map(p => p.id === item.productId ? { ...p, stok: newStok } : p))
      }
    }
    return { data, error: null }
  }

  const today = new Date().toDateString()
  const pendapatanHariIni = transaksi
    .filter(t => new Date(t.created_at).toDateString() === today)
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