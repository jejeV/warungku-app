import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function fmt(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

/**
 * Export laporan transaksi ke PDF
 * @param {Object} param
 * @param {Array}  param.transaksi  
 * @param {Array}  param.products  
 * @param {string} param.periode   
 * @param {number} param.totalPendapatan
 * @param {number} param.totalLaba
 */
export function exportLaporanPDF({ transaksi, products, periode, totalPendapatan, totalLaba }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const orange  = [233, 116, 0]
  const dark    = [28, 25, 23]
  const muted   = [120, 113, 108]
  const light   = [250, 249, 246]

  const pageW = doc.internal.pageSize.getWidth()
  const now   = new Date()

  /* ── Header banner ─────────────────────────────── */
  doc.setFillColor(...orange)
  doc.rect(0, 0, pageW, 36, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('WarungKu', 14, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(255, 220, 170)
  doc.text('Laporan Pendapatan & Transaksi', 14, 21)
  doc.text(`Periode: ${periode}`, 14, 27)

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(
    `Dicetak: ${now.toLocaleString('id-ID',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Asia/Jakarta'})} WIB`, pageW - 14, 27, { align: 'right' }
  )

  /* ── Summary cards ─────────────────────────────── */
  const cards = [
    { label: 'Total Pendapatan', value: fmt(totalPendapatan), color: orange },
    { label: 'Total Transaksi',  value: transaksi.length + ' transaksi', color: [59, 130, 246] },
    { label: 'Estimasi Laba',    value: fmt(totalLaba),       color: [22, 163, 74] },
  ]

  const cardW = (pageW - 28 - 8) / 3
  cards.forEach((card, i) => {
    const x = 14 + i * (cardW + 4)
    const y = 42

    doc.setFillColor(...light)
    doc.roundedRect(x, y, cardW, 22, 3, 3, 'F')

    doc.setDrawColor(...card.color)
    doc.setLineWidth(0.8)
    doc.line(x, y + 22, x + cardW, y + 22) // bottom accent
    doc.setLineWidth(0)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...muted)
    doc.text(card.label.toUpperCase(), x + 4, y + 7)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...dark)
    doc.text(card.value, x + 4, y + 16)
  })

  /* ── Riwayat transaksi table ───────────────────── */
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...dark)
  doc.text('Riwayat Transaksi', 14, 76)

  const rows = transaksi.map(t => {
    const laba = t.items.reduce((s, item) => {
      const p = products.find(p => p.id === item.productId)
      return s + (p ? (p.harga - p.modal) * item.qty : 0)
    }, 0)
    return [
      new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      new Date(t.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      t.items.map(i => `${i.nama} (${i.qty})`).join(', '),
      fmt(t.total),
      fmt(laba),
    ]
  })

  autoTable(doc, {
    startY: 80,
    head: [['Tanggal', 'Waktu', 'Item', 'Total', 'Est. Laba']],
    body: rows,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      textColor: dark,
    },
    headStyles: {
      fillColor: orange,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [253, 251, 248] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 16 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 28, halign: 'right', textColor: [22, 163, 74] },
    },
    margin: { left: 14, right: 14 },
  })

  /* ── Footer ────────────────────────────────────── */
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...muted)
    doc.text(
      `WarungKu — Halaman ${i} dari ${totalPages}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    )
  }

  doc.save(`laporan-warungku-${periode.replace(' ', '-').toLowerCase()}-${now.getFullYear()}.pdf`)
}