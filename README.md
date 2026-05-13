# WarungKu — Aplikasi Manajemen Stok & Pendapatan

Aplikasi manajemen stok warung berbasis web dengan tampilan mobile (mobile-first preview).

## 🛠 Tech Stack

| Layer       | Teknologi               |
|-------------|-------------------------|
| Framework   | React 18 + Vite         |
| Styling     | Tailwind CSS v3         |
| Routing     | React Router v6         |
| Charts      | Recharts                |
| Icons       | Lucide React            |
| State       | React Context API       |

## 🚀 Cara Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Jalankan development server
npm run dev

# 3. Buka di browser
# http://localhost:5173
```

## 📱 Fitur yang Sudah Ada

### ✅ Dashboard
- Ringkasan pendapatan hari ini
- Grafik pendapatan 7 hari terakhir
- Peringatan stok rendah
- Daftar transaksi terakhir

### ✅ Manajemen Produk
- Tambah / Edit / Hapus produk
- Restock stok masuk
- Filter kategori & pencarian
- Indikator stok rendah
- Laba per unit ditampilkan

### ✅ Kasir (POS)
- Pilih produk dan tambah ke keranjang
- Hitung kembalian otomatis
- Tombol nominal cepat
- Stok berkurang otomatis setelah transaksi
- Struk konfirmasi

### ✅ Laporan
- Filter periode (7/14/30 hari)
- Grafik batang pendapatan harian
- Pie chart produk terlaris
- Estimasi laba kotor
- Riwayat semua transaksi

## 📂 Struktur Project

```
src/
├── context/
│   └── StoreContext.jsx   # Global state (produk & transaksi)
├── components/
│   ├── MobileShell.jsx    # Frame preview mobile
│   └── BottomNav.jsx      # Navigasi bawah
├── pages/
│   ├── Dashboard.jsx
│   ├── Produk.jsx
│   ├── Kasir.jsx
│   └── Laporan.jsx
├── App.jsx                # Router utama
├── main.jsx
└── index.css
```

## 🔮 Langkah Selanjutnya (Sprint Berikutnya)

- [ ] Integrasi database (Supabase / Firebase)
- [ ] Autentikasi login
- [ ] Export PDF / Excel
- [ ] Notifikasi push stok rendah
- [ ] Mode PWA (installable)
