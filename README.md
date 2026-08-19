# RAKMAN — Inventory Management System

RAKMAN adalah aplikasi manajemen inventori modern yang dirancang untuk toko dan gudang skala kecil hingga menengah. Aplikasi ini memudahkan pengelolaan katalog produk, pemantauan stok real-time, pencatatan transaksi pembelian (purchase) dan penjualan (sale), manajemen data pemasok (supplier), serta visualisasi metrik bisnis penting dan peringatan stok menipis (low-stock alert).

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Akun Demo](#akun-demo)
- [Panduan Instalasi Lokal](#panduan-instalasi-lokal)
  - [Prasyarat](#prasyarat)
  - [Setup Backend](#1-setup-backend-server)
  - [Setup Frontend](#2-setup-frontend-client)
- [Struktur Direktori](#struktur-direktori)
- [Dokumen Kontrak & Aturan Proyek](#dokumen-kontrak--aturan-proyek)
- [Dokumentasi Deployment](#dokumentasi-deployment)

---

## Fitur Utama

- **Autentikasi & Otorisasi Berbasis Peran (RBAC)**: Mendukung role `admin`, `manager`, dan `staff` dengan token JWT.
- **Katalog Produk (CRUD)**: Pengelolaan produk dengan SKU unik, kategori, brand, harga beli/jual, batas minimum stok (`minStock`), dan mekanisme soft delete (`isActive = false`) untuk menjaga integritas data transaksi.
- **Manajemen Supplier (CRUD)**: Pengelolaan direktori pemasok barang dengan validasi integritas relasi produk.
- **Transaksi Pembelian (Purchase / Stok Masuk)**: Penambahan stok otomatis saat menerima barang dari supplier yang tercatat dalam audit trail.
- **Transaksi Penjualan (Sale / Stok Keluar)**: Pencatatan pesanan pelanggan, pengurangan stok otomatis, validasi ketersediaan stok, transaksi database atomik (`sequelize.transaction`), dan penguncian baris (`row lock / SELECT ... FOR UPDATE`) untuk mencegah race condition.
- **Audit Trail Pergerakan Stok (Stock Movement)**: Riwayat pergerakan stok *append-only* (purchase, sale, adjustment) yang merekam stok sebelum, sesudah, jumlah perubahan, dan staf penanggung jawab.
- **Peringatan Stok Menipis (Low Stock Alert)**: Indikasi visual otomatis untuk produk dengan `quantity <= minStock` (default 10 unit).
- **Dashboard Ringkas & Statistik**: Metrik agregasi database real-time meliputi total produk, jumlah kategori, item low stock, transaksi penjualan hari ini, omzet hari ini, dan total valuasi nilai inventori.
- **Pencarian, Filter, Sorting, & Paginasi**: Navigasi data produk yang responsif dan efisien.

---

## Tech Stack

### Backend
- **Runtime & Framework**: [Node.js](https://nodejs.org/) (v20+), [Express](https://expressjs.com/)
- **ORM & Database**: [Sequelize](https://sequelize.org/) (v6), [PostgreSQL](https://www.postgresql.org/)
- **Autentikasi & Keamanan**: [JSON Web Token (jsonwebtoken)](https://github.com/auth0/node-jsonwebtoken), [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Testing**: [Jest](https://jestjs.io/), [Supertest](https://github.com/ladjs/supertest)

### Frontend
- **Framework & Tooling**: [React](https://react.dev/) (v18/19), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`)
- **Routing & Networking**: [React Router](https://reactrouter.com/), [Axios](https://axios-http.com/)
- **State Management**: React State & React Context

---

## Akun Demo

Database seeder menyediakan akun demo berikut untuk pengujian dan evaluasi:

| Role | Email | Password | Deskripsi Hak Akses |
|---|---|---|---|
| **Admin** | `admin@mail.com` | `admin123` | Akses penuh: manajemen user, CRUD produk, soft delete produk, CRUD supplier, catat purchase, catat sale, dan lihat report/dashboard. |
| **Manager** | `manager@mail.com` | `manager123` | Kelola operasional: CRUD produk (tanpa delete), CRUD supplier, catat purchase, catat sale, dan lihat report/dashboard. |
| **Staff** | `staff@mail.com` | `staff123` | Kasir/Staf gudang: melihat produk dan mencatat transaksi penjualan (sale). |

---

## Panduan Instalasi Lokal

### Prasyarat
- [Node.js](https://nodejs.org/) versi 20 atau lebih baru
- [PostgreSQL](https://www.postgresql.org/) yang sedang berjalan di mesin lokal
- Git

---

### 1. Setup Backend (`server/`)

1. **Masuk ke folder `server`:**
   ```bash
   cd server
   ```

2. **Install dependency:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Sesuaikan isian file `.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   DB_USERNAME=postgres
   DB_PASSWORD=your_postgres_password
   DB_NAME=inventory_dev
   DB_HOST=127.0.0.1
   JWT_SECRET=your_super_secret_jwt_key
   ```

4. **Buat Database PostgreSQL:**
   Buat database untuk development dan test melalui terminal `psql` atau GUI (pgAdmin / DBeaver):
   ```sql
   CREATE DATABASE inventory_dev;
   CREATE DATABASE inventory_test;
   ```

5. **Jalankan Migrasi & Database Seeder:**
   ```bash
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```

6. **Jalankan Automated Tests (Opsional):**
   ```bash
   npm test
   ```

7. **Jalankan Server:**
   ```bash
   npm run dev
   # atau untuk mode production lokal:
   npm start
   ```
   Server backend akan aktif di `http://localhost:3000`.

---

### 2. Setup Frontend (`client/`)

1. **Buka terminal baru dan masuk ke folder `client`:**
   ```bash
   cd client
   ```

2. **Install dependency:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Pastikan endpoint API mengarah ke server backend lokal:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

4. **Jalankan Frontend Dev Server:**
   ```bash
   npm run dev
   ```
   Buka URL yang ditampilkan di terminal (biasanya `http://localhost:5173`) pada browser Anda.

---

## Struktur Direktori

```text
inventory-management/
├── server/                 # Backend API (Express, Sequelize, PostgreSQL)
│   ├── bin/www.js          # Entry point server HTTP
│   ├── config/             # Konfigurasi koneksi Sequelize & database
│   ├── controllers/        # Business logic handler per domain (Auth, Product, Supplier, dll)
│   ├── data/               # File JSON data awal untuk seeding
│   ├── helpers/            # Utilitas pembantu (JWT, Bcrypt)
│   ├── middlewares/        # Middlewares (Authentication, Authorization, ErrorHandler)
│   ├── migrations/         # Skrip migrasi skema tabel database
│   ├── models/             # Definisi model Sequelize dan relasi data
│   ├── routes/             # Definisi routing REST API
│   ├── seeders/            # Data inisialisasi awal (User, Supplier, Product)
│   └── __tests__/          # Unit & Integration test suite (Jest + Supertest)
│
├── client/                 # Frontend Web Application (React, Vite, Tailwind CSS)
│   ├── public/             # Asset statis publik
│   ├── src/
│   │   ├── components/     # Komponen UI reusable
│   │   ├── context/        # React Context untuk state autentikasi & global
│   │   ├── pages/          # Komponen halaman per route
│   │   ├── services/api.js # Axios instance & interceptor autentikasi
│   │   ├── App.jsx         # Komponen root aplikasi & router
│   │   └── main.jsx        # Entry point DOM rendering
│   └── vite.config.js      # Konfigurasi bundler Vite & Tailwind CSS plugin
│
├── docs/                   # Dokumentasi teknis & operasional
│   └── DEPLOYMENT.md       # Panduan deploy Backend ke GCP Compute Engine & Frontend ke Vercel
│
├── .github/workflows/      # Konfigurasi otomasi CI/CD GitHub Actions
├── SPEC.md                 # Dokumen spesifikasi fungsional & aturan bisnis MVP
├── ARCHITECTURE.md         # Dokumen kontrak teknis, skema DB, & format endpoint API
├── STYLE.md                # Panduan gaya penulisan kode (Coding Standards)
├── AGENTS.md               # Tata tertib kolaborasi AI agent & alur kerja Git
└── README.md               # Dokumentasi utama proyek
```

---

## Dokumen Kontrak & Aturan Proyek

Proyek ini dibangun dengan standar tata kelola multi-agent dan panduan ketat:

- **[`SPEC.md`](./SPEC.md)**: **Single Source of Truth** untuk ruang lingkup produk v1.0, aturan bisnis kritis (aturan stok non-negatif, transaksi atomik, row locking saat penjualan), serta batasan fitur di luar v1.0.
- **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**: **Kontrak Teknis** antar layer aplikasi. Menjelaskan kepemilikan folder per agent, skema relasi database, format response standar, tabel endpoint API beserta role-nya, dan konvensi frontend/backend.
- **[`STYLE.md`](./STYLE.md)**: **Panduan Gaya Koding** untuk menjaga konsistensi codebase. Mengatur penulisan controller, centralized error handling, penamaan, struktur komponen React, dan desain token Tailwind CSS.
- **[`AGENTS.md`](./AGENTS.md)**: **Aturan Tata Kelola Kolaborasi Agent** (Claude Code, Cline, Antigravity). Membatasi wilayah edit per agent, larangan menambah dependency sembarangan, alur branching Git, serta syarat pengujian dan keamanan.

---

## Dokumentasi Deployment

Untuk panduan lengkap mengenai deployment ke lingkungan production:
- **Backend (API)**: GCP Compute Engine (menambahkan aplikasi ke VM yang sudah berjalan dengan Nginx reverse proxy + PM2 + PostgreSQL + Certbot SSL).
- **Frontend (Client)**: Vercel Platform.

Silakan baca panduan lengkap di: **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)**.
