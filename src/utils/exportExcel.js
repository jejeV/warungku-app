import * as XLSX from 'xlsx'

function fmt(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

/**
 * Export laporan ke Excel (.xlsx) dengan 3 sheet:
 *   1. Ringkasan
 *   2. Riwayat Transaksi
 *   3. Produk Terlaris
 *
 * @param {Object} param
 * @param {Array}  param.transaksi
 * @param {Array}  param.products
 * @param {string} param.periode
 * @param {number} param.totalPendapatan
 * @param {number} param.totalLaba
 */
export function exportLaporanExcel({ transaksi, products, periode, totalPendapatan, totalLaba }) {
  const wb   = XLSX.utils.book_new()
  const now  = new Date()

  /* ── Sheet 1: Ringkasan ──────────────────────── */
  const ringkasanData = [
    ['WarungKu — Laporan Keuangan'],
    [`Periode: ${periode}`],
    [`Dicetak: ${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`],
    [],
    ['RINGKASAN'],
    ['Metrik', 'Nilai'],
    ['Total Pendapatan', fmt(totalPendapatan)],
    ['Total Transaksi', transaksi.length],
    ['Estimasi Laba Kotor', fmt(totalLaba)],
    ['Rata-rata per Transaksi', fmt(transaksi.length ? Math.round(totalPendapatan / transaksi.length) : 0)],
  ]

  const wsRingkasan = XLSX.utils.aoa_to_sheet(ringkasanData)
  wsRingkasan['!cols'] = [{ wch: 28 }, { wch: 22 }]
  XLSX.utils.book_append_sheet(wb, wsRingkasan, 'Ringkasan')

  /* ── Sheet 2: Riwayat Transaksi ──────────────── */
  const txHeader = ['ID Transaksi', 'Tanggal', 'Waktu', 'Item', 'Jumlah Item', 'Total', 'Bayar', 'Kembalian', 'Est. Laba']
  const txRows   = transaksi.map(t => {
    const laba = t.items.reduce((s, item) => {
      const p = products.find(p => p.id === item.productId)
      return s + (p ? (p.harga - p.modal) * item.qty : 0)
    }, 0)
    const totalQty = t.items.reduce((s, i) => s + i.qty, 0)
    return [
      t.id,
      new Date(t.tanggal).toLocaleDateString('id-ID'),
      new Date(t.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      t.items.map(i => `${i.nama} x${i.qty}`).join(' | '),
      totalQty,
      t.total,
      t.bayar,
      t.kembalian,
      laba,
    ]
  })

  const wsTx = XLSX.utils.aoa_to_sheet([txHeader, ...txRows])
  wsTx['!cols'] = [
    { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 40 },
    { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 16 },
  ]
  XLSX.utils.book_append_sheet(wb, wsTx, 'Riwayat Transaksi')

  /* ── Sheet 3: Produk Terlaris ─────────────────── */
  const productSales = {}
  const productRevenue = {}
  transaksi.forEach(t => t.items.forEach(item => {
    productSales[item.nama]   = (productSales[item.nama]   || 0) + item.qty
    productRevenue[item.nama] = (productRevenue[item.nama] || 0) + item.harga * item.qty
  }))

  const prodHeader = ['Produk', 'Total Terjual', 'Total Pendapatan']
  const prodRows   = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .map(([nama, qty]) => [nama, qty, productRevenue[nama] || 0])

  const wsProd = XLSX.utils.aoa_to_sheet([prodHeader, ...prodRows])
  wsProd['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsProd, 'Produk Terlaris')

  /* ── Download ────────────────────────────────── */
  const filename = `laporan-warungku-${periode.replace(' ', '-').toLowerCase()}-${now.getFullYear()}.xlsx`
  XLSX.writeFile(wb, filename)
}