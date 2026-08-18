# SPEC.md — Inventory Management System

> Sumber kebenaran tunggal untuk SEMUA agent (Claude Code, Cline, Antigravity).
> Kalau sesuatu tidak tertulis di sini → **berhenti dan tanya owner**, jangan mengarang.

---

## 1. Tujuan Project

Aplikasi manajemen inventori untuk toko/gudang kecil-menengah. User bisa mengelola
produk, memantau stok, mencatat pembelian (purchase) dan penjualan (sale), mengelola
supplier, serta melihat laporan dan alert stok menipis.

## 2. Scope MVP (v1.0)

Yang **MASUK** v1.0:

- Autentikasi (register, login) dengan JWT
- Role-based access: `admin`, `manager`, `staff`
- CRUD Product (dengan SKU unik)
- CRUD Supplier
- Pencatatan Purchase → stok bertambah otomatis
- Pencatatan Sale → stok berkurang otomatis
- Riwayat pergerakan stok (stock movement / audit trail)
- Dashboard ringkas: total produk, item low-stock, penjualan hari ini
- List produk dengan search, filter kategori, sort, pagination

Yang **TIDAK MASUK** v1.0 (jangan dikerjakan sampai diminta):

- Barcode / QR scanner
- Export PDF & Excel
- Dark mode
- AI demand forecasting
- Multi-warehouse
- WebSocket real-time
- Mobile app
- Notifikasi email/push (v1 cukup flag low-stock di response API)

## 3. Definisi Istilah

| Istilah | Arti di project ini |
|---|---|
| Stock | Angka `quantity` pada tabel `Products`. Sumber kebenaran stok. |
| Stock Movement | Baris log setiap perubahan stok. Tidak pernah di-update/delete, hanya insert. |
| Low stock | `quantity <= minStock` (default `minStock` = 10) |
| Purchase | Barang masuk dari supplier. Menambah `quantity`. |
| Sale | Barang keluar ke customer. Mengurangi `quantity`. |

## 4. Aturan Bisnis (WAJIB, ini yang paling sering di-halu-kan agent)

1. **Stok tidak boleh negatif.** Sale ditolak (HTTP 400) kalau `quantity` yang diminta
   melebihi stok tersedia. Cek dilakukan di dalam transaksi database, bukan di frontend.
2. **Setiap perubahan stok wajib lewat transaksi DB** (`sequelize.transaction`) yang
   mencakup: update `Products.quantity` + insert `StockMovements`. Kalau salah satu
   gagal, keduanya rollback.
3. **Update stok pakai row lock** (`SELECT ... FOR UPDATE` / `lock: transaction.LOCK.UPDATE`)
   untuk mencegah race condition saat dua sale bersamaan.
4. **SKU unik** dan tidak boleh diubah setelah produk dibuat.
5. **Harga tidak boleh negatif.** `sellingPrice` dan `purchasePrice` >= 0.
6. **Produk tidak di-hard delete** kalau sudah pernah dipakai di transaksi. Pakai
   soft delete (`isActive = false`).
7. **Password tidak pernah dikembalikan** di response API mana pun.

## 5. Role & Permission

| Aksi | admin | manager | staff |
|---|:---:|:---:|:---:|
| Kelola user | ✅ | ❌ | ❌ |
| CRUD product | ✅ | ✅ | ❌ |
| Lihat product | ✅ | ✅ | ✅ |
| CRUD supplier | ✅ | ✅ | ❌ |
| Catat purchase | ✅ | ✅ | ❌ |
| Catat sale | ✅ | ✅ | ✅ |
| Lihat report | ✅ | ✅ | ❌ |

## 6. Tech Stack (DIKUNCI — dilarang menambah/mengganti tanpa izin)

- Backend: Node.js 20, Express 4, Sequelize 6, PostgreSQL
- Auth: `jsonwebtoken`, `bcryptjs`
- Test: Jest + Supertest
- Frontend: React 18 + Vite, React Router, Axios
- Styling: Tailwind CSS
- State: React state + Context. **Bukan** Redux/Zustand/React Query di v1.


## 7. Definition of Done (satu task dianggap selesai kalau...)

- [ ] Kode jalan lokal tanpa error
- [ ] Ada test (positif + negatif + validasi) dan `npm test` hijau
- [ ] Tidak melanggar `STYLE.md`
- [ ] Tidak menambah dependency baru
- [ ] File yang disentuh hanya yang disebut di issue
- [ ] Ada bukti output terminal di deskripsi PR
