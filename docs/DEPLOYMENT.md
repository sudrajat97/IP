# Panduan Deployment RAKMAN

Dokumen ini berisi panduan langkah demi langkah untuk melakukan deployment aplikasi **RAKMAN** ke lingkungan *production*.

---

## 1. Ringkasan Arsitektur Production

Aplikasi RAKMAN dideploy menggunakan arsitektur terpisah (*decoupled architecture*):

- **Backend API (`server/`)**: Dijalankan pada instance **GCP Compute Engine (VM Linux)** yang **sudah aktif dan sudah menjalankan aplikasi lain** (berbagi sistem dengan Nginx, PM2, PostgreSQL, dan Certbot yang telah terpasang).
- **Frontend SPA (`client/`)**: Dihosting di **Vercel** dengan build otomatis terhubung ke repositori Git.
- **Komunikasi**: Frontend Vercel memanggil endpoint REST API di VM melalui subdomain HTTPS khusus (misal: `https://api.rakman.yourdomain.com/api`).

```text
[ Pengguna Browser ]
        │
        ├───► [ Vercel ] (Frontend React SPA: rakman.vercel.app / custom domain)
        │         │
        │         ▼ (HTTPS REST API Requests)
        └───► [ GCP Compute Engine VM ]
                  │
                  ├──► [ Nginx ] (Reverse Proxy: api.rakman.yourdomain.com:443)
                  │         │ (proxy_pass HTTP)
                  │         ▼
                  ├──► [ PM2 Process ] (rakman-api: port 3001)
                  │         │
                  │         ▼
                  └──► [ PostgreSQL ] (Database: rakman_prod)
```

---

## 2. Setup Database PostgreSQL di VM

> **Catatan:** PostgreSQL sudah berjalan di VM. Kita hanya perlu membuat database dan user khusus untuk RAKMAN agar terisolasi dari database aplikasi lain di VM yang sama.

1. **Masuk ke shell PostgreSQL sebagai superuser `postgres`:**
   ```bash
   sudo -u postgres psql
   ```

2. **Buat user dan database baru untuk RAKMAN:**
   Gantilah `<STRONG_DB_PASSWORD>` dengan kata sandi yang kuat dan aman.
   ```sql
   -- Buat user dedicated untuk RAKMAN
   CREATE USER rakman_user WITH ENCRYPTED PASSWORD '<STRONG_DB_PASSWORD>';

   -- Buat database khusus RAKMAN dengan pemilik rakman_user
   CREATE DATABASE rakman_prod OWNER rakman_user;

   -- Berikan hak akses penuh pada database
   GRANT ALL PRIVILEGES ON DATABASE rakman_prod TO rakman_user;
   ```

3. **(Opsional untuk PostgreSQL 15+) Pastikan hak akses schema public diberikan:**
   ```sql
   \c rakman_prod
   GRANT ALL ON SCHEMA public TO rakman_user;
   ```

4. **Keluar dari PostgreSQL:**
   ```sql
   \q
   ```

---

## 3. Deployment Backend (GCP Compute Engine)

### 3.1. Clone Repositori dan Install Dependencies

1. **Pilih atau buat direktori kerja aplikasi di VM (misalnya di `/var/www/rakman` atau direktori home):**
   ```bash
   cd /var/www
   # atau cd ~/apps
   git clone <URL_REPOSITORI_GIT> rakman
   cd rakman/server
   ```

2. **Install dependency backend:**
   ```bash
   npm ci --omit=dev
   # atau jika package-lock disinkronkan:
   npm install --production
   ```

### 3.2. Konfigurasi Environment Variables Production

Buat file `.env` di dalam direktori `server/`:
```bash
nano .env
```

Isi dengan konfigurasi production:
```env
# Port lokal khusus RAKMAN di VM (Pilih port yang belum dipakai aplikasi lain, misal 3001)
PORT=3001
NODE_ENV=production

# Database Credentials
DB_USERNAME=rakman_user
DB_PASSWORD=<STRONG_DB_PASSWORD>
DB_NAME=rakman_prod
DB_HOST=127.0.0.1

# Format Connection URL (alternatif koneksi Sequelize production)
DATABASE_URL=postgresql://rakman_user:<STRONG_DB_PASSWORD>@127.0.0.1:5432/rakman_prod

# JWT Secret Key
# PENTING: Wajib string acak berkekuatan tinggi dan HARUS BERBEDA dari environment development!
JWT_SECRET=<STRONG_RANDOM_256BIT_SECRET_KEY>
```

> ⚠️ **PERINGATAN KEAMANAN (`JWT_SECRET`):**
> Jangan pernah menggunakan nilai `JWT_SECRET` yang sama dengan development/staging. Buat secret acak yang kuat menggunakan openssl di terminal:
> ```bash
> openssl rand -base64 32
> ```

### 3.3. Menjalankan Database Migration & Seeder

Jalankan migrasi tabel database Sequelize untuk membuat skema tabel di production:
```bash
npx sequelize-cli db:migrate
```

*(Opsional)* Jika ingin menginisialisasi akun awal / demo (admin, manager, staff):
```bash
npx sequelize-cli db:seed:all
```

### 3.4. Konfigurasi dan Jalankan PM2

Jalankan backend RAKMAN menggunakan PM2 sebagai background process manager:

1. **Jalankan aplikasi dengan nama proses unik (`rakman-api`):**
   ```bash
   pm2 start bin/www.js --name "rakman-api"
   ```

2. **Simpan daftar proses PM2 agar otomatis berjalan saat VM reboot:**
   ```bash
   pm2 save
   ```

3. **Verifikasi status server:**
   ```bash
   pm2 status
   pm2 logs rakman-api --lines 20
   ```

---

## 4. Konfigurasi Nginx Reverse Proxy (Backend API)

Nginx di VM hanya bertindak sebagai *reverse proxy* untuk meneruskan trafik dari subdomain API publik ke port internal PM2 (`3001`).

1. **Buat file konfigurasi server block baru di `/etc/nginx/sites-available/`:**
   ```bash
   sudo nano /etc/nginx/sites-available/rakman-api.conf
   ```

2. **Tambahkan konfigurasi berikut (sesuaikan `api.rakman.yourdomain.com` dengan domain Anda):**
   ```nginx
   server {
       listen 80;
       server_name api.rakman.yourdomain.com;

       # Batasan ukuran upload body jika diperlukan
       client_max_body_size 10M;

       location / {
           proxy_pass http://127.0.0.1:3001;
           proxy_http_version 1.1;

           # Header proxy standar
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;

           # Buffer & timeout settings
           proxy_cache_bypass $http_upgrade;
           proxy_connect_timeout 60s;
           proxy_send_timeout 60s;
           proxy_read_timeout 60s;
       }
   }
   ```

3. **Aktifkan konfigurasi dengan membuat symbolic link ke `sites-enabled`:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/rakman-api.conf /etc/nginx/sites-enabled/
   ```

4. **Uji sintaks konfigurasi Nginx:**
   ```bash
   sudo nginx -t
   ```

5. **Reload Nginx untuk menerapkan perubahan tanpa memutus aplikasi lain yang sedang berjalan:**
   ```bash
   sudo systemctl reload nginx
   ```

---

## 5. Setup SSL / HTTPS dengan Certbot (Let's Encrypt)

Gunakan Certbot yang sudah ada di VM untuk menerbitkan sertifikat SSL bagi subdomain backend baru:

1. **Pastikan DNS Record `A` untuk subdomain `api.rakman.yourdomain.com` sudah mengarah ke IP publik VM GCP.**

2. **Jalankan Certbot untuk subdomain API:**
   ```bash
   sudo certbot --nginx -d api.rakman.yourdomain.com
   ```
   *Certbot akan secara otomatis memperbarui konfigurasi Nginx untuk mengaktifkan HTTPS port 443 dan konfigurasi redirect dari HTTP.*

3. **Uji coba pembaruan otomatis (Dry Run):**
   ```bash
   sudo certbot renew --dry-run
   ```

---

## 6. Deployment Frontend (Vercel)

Frontend React + Vite di-deploy secara terpisah ke platform **Vercel**:

### 6.1. Langkah Deployment di Vercel Dashboard

1. **Login ke [Vercel Dashboard](https://vercel.com/)**.
2. Klik tombol **"Add New..."** > **"Project"**.
3. **Import Git Repository** tempat proyek RAKMAN berada.
4. Pada halaman konfigurasi project (**Configure Project**):
   - **Project Name**: `rakman` (atau sesuai keinginan).
   - **Framework Preset**: `Vite`.
   - **Root Directory**: Klik `Edit` dan pilih folder **`client`**.
   - **Build and Output Settings**:
     - *Build Command*: `npm run build` (default).
     - *Output Directory*: `dist` (default).
     - *Install Command*: `npm install` (default).
5. **Environment Variables**:
   Tambahkan variabel berikut pada bagian **Environment Variables**:
   | Key | Value | Keterangan |
   |---|---|---|
   | `VITE_API_URL` | `https://api.rakman.yourdomain.com/api` | Endpoint API publik backend di VM |
6. Klik **"Deploy"**.

### 6.2. Catatan Konfigurasi CORS di Backend

Pastikan backend mengizinkan permintaan dari domain Vercel. Karena backend menggunakan middleware `cors()` di `server/app.js`:
```js
app.use(cors())
```
Secara default seluruh origin diperbolehkan. Jika ingin membatasi origin secara spesifik di production, tambahkan domain Vercel (misal: `https://rakman.vercel.app`) ke whitelist CORS.

---

## 7. Referensi Environment Variables Production

### Backend (`server/.env` di VM)
| Variabel | Wajib | Contoh Nilai | Keterangan |
|---|---|---|---|
| `PORT` | Ya | `3001` | Port internal aplikasi pada VM (pilih yang belum digunakan). |
| `NODE_ENV` | Ya | `production` | Menandakan environment production. |
| `DB_USERNAME` | Ya | `rakman_user` | Username database PostgreSQL khusus RAKMAN. |
| `DB_PASSWORD` | Ya | `s3cur3P@ssw0rd!` | Password user PostgreSQL. |
| `DB_NAME` | Ya | `rakman_prod` | Nama database PostgreSQL RAKMAN. |
| `DB_HOST` | Ya | `127.0.0.1` | Host database (localhost VM). |
| `DATABASE_URL` | Opsional | `postgresql://rakman_user:pass@127.0.0.1:5432/rakman_prod` | URI koneksi Sequelize database. |
| `JWT_SECRET` | Ya | `8fbc8d... (string 32+ karakter)` | **Wajib berbeda dari dev.** Kunci rahasia enkripsi token JWT. |

### Frontend (Vercel Environment Variables)
| Variabel | Wajib | Contoh Nilai | Keterangan |
|---|---|---|---|
| `VITE_API_URL` | Ya | `https://api.rakman.yourdomain.com/api` | URL dasar untuk semua request Axios frontend ke backend API. |

---

## 8. Alur Pembaruan Aplikasi (Maintenance / CI-CD)

### Memperbarui Backend di VM:
Jika terdapat commit baru pada branch utama:
```bash
cd /var/www/rakman
git pull origin main

# Update dependency backend & database jika ada migrasi baru
cd server
npm install --production
npx sequelize-cli db:migrate

# Restart proses PM2
pm2 restart rakman-api
```

### Memperbarui Frontend di Vercel:
Vercel secara otomatis mendeteksi setiap `git push` ke branch utama (atau branch yang dihubungkan) dan menjalankan proses build & deployment secara instan tanpa perlu intervensi manual.
