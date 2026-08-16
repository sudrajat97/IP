# AGENTS.md — Aturan Main untuk Semua AI Agent

> Berlaku untuk Claude Code, Cline, dan Antigravity.
> Salin file ini juga sebagai `CLAUDE.md` dan `.clinerules/00-rules.md`.

---

## 0. Baca dulu sebelum menulis kode apa pun

Urutan wajib di awal setiap sesi:
1. `SPEC.md` — apa yang dibangun & aturan bisnis
2. `ARCHITECTURE.md` — schema, endpoint, kepemilikan folder
3. `STYLE.md` — gaya penulisan kode
4. File yang akan diubah — **baca isinya, jangan menebak**

## 1. Anti-Halusinasi (aturan paling penting)

- **Dilarang menebak isi file.** Selalu baca file dulu sebelum mengedit.
- **Dilarang mengarang nama fungsi, kolom DB, endpoint, atau field response.**
  Kalau tidak ada di `ARCHITECTURE.md` → berhenti dan tanya.
- **Dilarang menambah dependency baru.** Termasuk library "kecil" seperti
  `lodash`, `moment`, `uuid`. Kalau merasa butuh → tanya dulu.
- **Dilarang mengklaim "sudah jalan" tanpa bukti.** Sertakan output terminal
  (`npm test`, `curl`, log) di deskripsi PR.
- **Dilarang menulis kode untuk fitur yang ada di daftar "TIDAK MASUK v1.0"**
  di `SPEC.md`, meskipun kelihatan berguna.
- Kalau ada dua cara dan spesifikasi ambigu → **jangan pilih sendiri**, tanya.
- Kalau sebuah test gagal, **jangan mengubah test-nya supaya hijau.**
  Perbaiki kodenya, atau laporkan kalau memang spesifikasinya yang salah.

## 2. Batas Wilayah Kerja

| Agent | Boleh mengubah | Dilarang menyentuh |
|---|---|---|
| **Claude Code** | `server/**` | `client/**`, `.github/**` |
| **Cline** | `client/**` | `server/**`, `.github/**` |
| **Antigravity** | `.github/**`, `docs/**`, `README.md`, file konfigurasi root | `server/**`, `client/**` |

`SPEC.md`, `ARCHITECTURE.md`, `STYLE.md`, `AGENTS.md` hanya boleh diubah oleh manusia.

## 3. Ukuran Task

- Satu task = satu GitHub Issue = satu branch = satu PR.
- **Maksimal ~200 baris perubahan per PR.** Kalau lebih besar, pecah dulu dan
  laporkan rencana pemecahannya.
- Untuk task non-trivial: kirim **rencana singkat dulu** (file apa yang diubah,
  fungsi apa yang dibuat), tunggu approval owner, baru menulis kode.

## 4. Alur Git

```bash
git checkout main && git pull
git checkout -b feat/12-product-crud
# ...kerja...
git add -A
git commit -m "feat(product): tambah endpoint CRUD product refs #12"
git push -u origin feat/12-product-crud
```

- **Dilarang commit langsung ke `main`.**
- **Dilarang `git push --force`, `git rebase`, atau menghapus branch orang lain.**
- **Dilarang mengubah `package-lock.json`** kecuali memang task-nya soal dependency.
- Commit message: `type(scope): deskripsi refs #issue`
  (`type` = feat / fix / test / docs / chore / refactor)

## 5. Format Laporan Selesai

Setiap PR wajib berisi:

```md
## Apa yang dikerjakan
- ...

## File yang diubah
- server/controllers/ProductController.js (baru)
- server/routes/product.js (baru)

## Bukti jalan
$ npm test
 PASS  __tests__/product.test.js
 Tests: 8 passed

## Yang TIDAK saya kerjakan / ragu
- Belum menangani kasus X karena tidak ada di SPEC.md
```

Bagian terakhir wajib diisi jujur. Menulis "tidak ada" padahal ada keraguan
dianggap pelanggaran berat.

## 6. Testing

- Setiap endpoint minimal punya: 1 test sukses, 1 test validasi gagal (400),
  1 test tanpa token (401), 1 test role salah (403).
- Test pakai database test terpisah, dan dibersihkan di `afterAll`.
- Dilarang memakai `.skip`, `.only`, atau `--forceExit` untuk melewati test.

## 7. Keamanan

- Password selalu di-hash bcrypt (salt rounds 10) lewat hook Sequelize.
- Password dan hash tidak pernah masuk response API atau log.
- Semua secret (`JWT_SECRET`, kredensial DB) dari `.env`. **Dilarang hardcode.**
- `.env` tidak pernah di-commit. Update `.env.example` kalau ada variabel baru.
- Query selalu lewat Sequelize (parameterized). Dilarang string concat SQL.
