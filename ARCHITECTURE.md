# ARCHITECTURE.md — Kontrak Teknis

> Ini kontrak antar-agent. Backend dan frontend dikerjakan agent berbeda, jadi
> **bentuk request/response di bawah ini adalah hukum**. Kalau butuh field baru,
> ubah file ini dulu lewat PR terpisah, baru koding.

---

## 1. Struktur Folder (kepemilikan per agent)

```
inventory-management/
├── server/                 ← OWNER: Claude Code
│   ├── config/config.js
│   ├── models/             (Sequelize models)
│   ├── migrations/
│   ├── seeders/
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/        (authentication, authorization, errorHandler)
│   ├── helpers/            (jwt.js, bcrypt.js)
│   ├── __tests__/
│   ├── app.js
│   └── bin/www.js
│
├── client/                 ← OWNER: Cline
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/api.js
│   │   ├── context/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
│
├── .github/workflows/      ← OWNER: Antigravity
├── docs/                   ← OWNER: Antigravity
├── SPEC.md / ARCHITECTURE.md / STYLE.md / AGENTS.md   ← OWNER: kamu (manusia)
└── README.md               ← OWNER: Antigravity
```

**Aturan:** agent hanya boleh mengubah file di folder miliknya. Kalau butuh
perubahan di folder agent lain → buka issue, jangan edit sendiri.

## 2. Schema Database

### Users
| kolom | tipe | keterangan |
|---|---|---|
| id | integer PK | |
| email | string | unique, not null, format email |
| password | string | hashed bcrypt, not null |
| role | string | enum: admin / manager / staff, default `staff` |

### Suppliers
| kolom | tipe | keterangan |
|---|---|---|
| id | integer PK | |
| companyName | string | not null |
| contactPerson | string | |
| phone | string | |
| email | string | |
| address | text | |

### Products
| kolom | tipe | keterangan |
|---|---|---|
| id | integer PK | |
| name | string | not null |
| sku | string | unique, not null, immutable |
| category | string | not null |
| brand | string | |
| purchasePrice | integer | >= 0, satuan rupiah penuh (bukan desimal) |
| sellingPrice | integer | >= 0 |
| quantity | integer | >= 0, default 0 |
| minStock | integer | default 10 |
| isActive | boolean | default true |
| SupplierId | integer FK | nullable |

### StockMovements (append-only, tidak pernah di-update)
| kolom | tipe | keterangan |
|---|---|---|
| id | integer PK | |
| ProductId | integer FK | not null |
| type | string | enum: `purchase` / `sale` / `adjustment` |
| quantity | integer | selalu positif; arah ditentukan `type` |
| quantityBefore | integer | stok sebelum |
| quantityAfter | integer | stok sesudah |
| UserId | integer FK | siapa yang melakukan |
| note | string | |

### Sales
| kolom | tipe | keterangan |
|---|---|---|
| id | integer PK | |
| customerName | string | |
| totalAmount | integer | dihitung server, bukan dikirim client |
| paymentStatus | string | enum: `paid` / `unpaid` |
| UserId | integer FK | |

### SaleItems
`id`, `SaleId` FK, `ProductId` FK, `quantity`, `priceAtSale` (harga saat transaksi, di-snapshot)

## 3. Format Response Standar

Sukses:
```json
{ "message": "Product created", "data": { } }
```

List dengan pagination:
```json
{
  "data": [],
  "meta": { "page": 1, "limit": 10, "totalItems": 57, "totalPages": 6 }
}
```

Error (SEMUA error lewat `errorHandler` middleware):
```json
{ "message": "Stok tidak mencukupi" }
```

Kode status yang dipakai: `200`, `201`, `400` (validasi/business rule), `401`
(belum login / token invalid), `403` (role tidak berwenang), `404`, `500`.

## 4. Daftar Endpoint

| Method | Path | Role | Keterangan | Status |
|---|---|---|---|---|
| POST | `/api/auth/register` | publik | body: email, password, role | ✅ |
| POST | `/api/auth/login` | publik | return `{ access_token, user }` | ✅ |
| GET | `/api/products` | semua | query: search, category, sort, page, limit | ✅ |
| GET | `/api/products/:id` | semua | | ✅ |
| POST | `/api/products` | admin, manager | | ✅ |
| PUT | `/api/products/:id` | admin, manager | | ✅ |
| DELETE | `/api/products/:id` | admin | soft delete | ✅ |
| GET | `/api/suppliers` | admin, manager | | ✅ |
| POST | `/api/suppliers` | admin, manager | | ✅ |
| POST | `/api/purchases` | admin, manager | stok naik | ✅ |
| POST | `/api/sales` | semua | stok turun | ✅ |
| GET | `/api/sales` | admin, manager | | ⬜ |
| GET | `/api/stock-movements/:productId` | admin, manager | | ⬜ |
| GET | `/api/dashboard/summary` | admin, manager | | ⬜ |
| GET | `/api/products/categories` | semua | | ⬜ |
Status: ✅ sudah diimplementasi · ⬜ belum ada di kode

### Catatan visibilitas produk

- `GET /api/products` hanya menampilkan produk dengan `isActive: true`
- `GET /api/products/:id` — produk `isActive: false` hanya terlihat oleh admin & manager; staff mendapat 404 (bukan 403, supaya keberadaan produk tidak bocor).
### Catatan kategori

- `GET /api/products/categories` — belum diimplementasi. Sementara frontend
  menurunkan daftar kategori dari produk di halaman aktif, sehingga dropdown
  filter bisa tidak menampilkan semua kategori yang ada.

### Catatan Supplier

- `DELETE /api/suppliers/:id` menghitung SEMUA produk yang mereferensikan
  supplier tersebut, termasuk yang `isActive: false` — supaya riwayat asal
  barang tidak hilang saat supplier dihapus. Kalau masih ada produk yang
  terhubung (aktif maupun nonaktif), request ditolak 400.
- `GET /api/suppliers/:id`, `PUT /api/suppliers/:id`, `DELETE /api/suppliers/:id`
  sudah diimplementasikan di kode (lihat `SupplierController.js`) tapi belum
  punya baris sendiri di tabel di atas karena hanya kolom Status yang boleh
  diubah agent untuk task ini — perlu ditambahkan manual oleh owner.

### Catatan Purchase

- Tabel `Purchases` belum ada di v1.0. `SupplierId` yang dikirim ke
  `POST /api/purchases` tidak disimpan permanen — hanya dicatat sebagai
  referensi teks di `StockMovement.note`.

### Contoh body POST /api/sales
```json
{
  "customerName": "Budi",
  "paymentStatus": "paid",
  "items": [
    { "ProductId": 1, "quantity": 2 },
    { "ProductId": 5, "quantity": 1 }
  ]
}
```
Server yang menghitung `priceAtSale` dan `totalAmount`. Harga dari client **diabaikan**.

## 5. Header Autentikasi

```
Authorization: Bearer <access_token>
```
Payload JWT hanya berisi: `{ id, email, role }`. Tidak ada data lain.

## 6. Alur Kritis: POST /api/sales

```
1. Buka transaksi
2. Untuk tiap item: SELECT product FOR UPDATE (lock baris)
3. Kalau product.quantity < item.quantity → throw 400 "Stok tidak mencukupi"
4. Kurangi quantity, simpan
5. Insert StockMovement (type: sale, quantityBefore, quantityAfter)
6. Insert Sale + SaleItems dengan priceAtSale = product.sellingPrice
7. Commit. Kalau ada error di langkah mana pun → rollback penuh
```
## 7. Konvensi Frontend

- Key localStorage: `rakman_token` (JWT), `rakman_user` (data user)
- Semua request API lewat `client/src/services/api.js` (axios instance
  dengan interceptor yang menambahkan header Authorization)
- Struktur folder: `pages/` (halaman per route), `components/` (komponen
  reusable), `context/` (React Context), `services/` (API layer)
