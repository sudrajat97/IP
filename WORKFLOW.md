# WORKFLOW.md — Panduan End-to-End

Cara menjalankan project Inventory Management System dengan 3 AI agent
(Claude Code, Cline, Antigravity) tanpa mereka halu dan tabrakan.

---

## FASE 0 — Persiapan (kamu sendiri, TANPA agent) — ±2 jam

Ini fase paling penting. Jangan lewati. Kalau fase ini asal-asalan, semua fase
setelahnya berantakan.

```bash
mkdir inventory-management && cd inventory-management
git init
mkdir -p server client docs .github/workflows
```

1. Tulis/sesuaikan `SPEC.md`, `ARCHITECTURE.md`, `STYLE.md`, `AGENTS.md`.
   Terutama `ARCHITECTURE.md` — schema DB dan daftar endpoint harus **final**
   sebelum agent mulai. Ini yang mencegah backend dan frontend bikin asumsi berbeda.
2. Bikin `.gitignore` (`node_modules`, `.env`, `dist`).
3. Bikin `.env.example`.
4. Salin aturan agent:
   ```bash
   cp AGENTS.md CLAUDE.md
   mkdir -p .clinerules && cp AGENTS.md .clinerules/00-rules.md
   ```
5. Commit & push ke GitHub:
   ```bash
   git add -A
   git commit -m "docs: spesifikasi awal project"
   git remote add origin git@github.com:USERNAME/inventory-management.git
   git push -u origin main
   ```

---

## FASE 1 — Setup GitHub — ±30 menit

1. **Branch protection** — Settings → Branches → Add rule untuk `main`:
   - Require a pull request before merging
   - Require status checks to pass
   - (jangan centang "Allow force pushes")
2. **Labels**: `backend`, `frontend`, `infra`, `bug`, `blocked`
3. **Milestone**: `v1.0 MVP`
4. **Project board** (Projects → Board): kolom `Todo / In Progress / Review / Done`
5. **Issue template** `.github/ISSUE_TEMPLATE/task.md`:

```md
## Tujuan
(satu kalimat)

## Agent
(Claude Code / Cline / Antigravity)

## File yang boleh disentuh
- server/controllers/ProductController.js

## Acceptance Criteria
- [ ] GET /api/products mengembalikan format sesuai ARCHITECTURE.md §3
- [ ] Pagination jalan
- [ ] Test lulus: sukses, 401, 403

## Referensi
- SPEC.md §4 aturan bisnis
- ARCHITECTURE.md §4 daftar endpoint
```

---

## FASE 2 — Fondasi (KERJAKAN SENDIRI, jangan diserahkan ke agent) — ±3 jam

Agent bekerja jauh lebih baik kalau sudah ada pola untuk ditiru. Jadi kamu yang
menulis **satu contoh lengkap** dulu:

- `server/app.js`, koneksi DB, `config/config.js`
- Model `User` + migration
- `middlewares/errorHandler.js`
- `controllers/AuthController.js` (register + login)
- `__tests__/auth.test.js`

Setelah ini jadi, tambahkan ke `AGENTS.md`:

> Sebelum menulis controller baru, baca `server/controllers/AuthController.js`
> dan tiru strukturnya persis.

Sekarang agent punya patokan nyata, bukan cuma deskripsi.

---

## FASE 3 — Bagi Task ke Issue — ±1 jam

Urutkan berdasarkan ketergantungan. Backend jalan duluan, frontend menyusul.

**Gelombang 1 (paralel, tidak saling tergantung)**
| # | Issue | Agent |
|---|---|---|
| 1 | Model + migration Product & Supplier | Claude Code |
| 2 | Setup Vite + routing + halaman Login | Cline |
| 3 | GitHub Actions CI (install, lint, test) | Antigravity |

**Gelombang 2**
| # | Issue | Agent |
|---|---|---|
| 4 | CRUD Product + pagination/search/sort | Claude Code |
| 5 | Auth context + simpan token + protected route | Cline |
| 6 | Setup ESLint + Prettier sesuai STYLE.md | Antigravity |

**Gelombang 3**
| # | Issue | Agent |
|---|---|---|
| 7 | StockMovement + POST /api/purchases (transaksi) | Claude Code |
| 8 | Halaman list produk + form tambah produk | Cline |

**Gelombang 4**
| # | Issue | Agent |
|---|---|---|
| 9 | POST /api/sales dengan row lock + cek stok negatif | Claude Code |
| 10 | Halaman kasir/sale | Cline |

**Gelombang 5**
| # | Issue | Agent |
|---|---|---|
| 11 | GET /api/dashboard/summary | Claude Code |
| 12 | Halaman dashboard | Cline |
| 13 | README + dokumentasi deploy | Antigravity |

**Aturan:** jangan jalankan dua issue yang menyentuh file sama secara bersamaan.

---

## FASE 4 — Siapkan Worktree (biar 3 agent tidak timpa-menimpa)

```bash
git worktree add ../inv-claude  -b feat/4-product-crud
git worktree add ../inv-cline   -b feat/5-auth-context
git worktree add ../inv-anti    -b feat/6-eslint
```

Sekarang ada 3 folder terpisah, satu repo yang sama:
- Buka `../inv-claude` di VS Code → jalankan Claude Code di sini
- Buka `../inv-cline` di VS Code window lain → Cline di sini
- Buka `../inv-anti` di Antigravity

Kalau tanpa worktree, tiga agent mengedit folder yang sama, saling menimpa file
setengah jadi, dan `git status` jadi campur aduk — sulit ditelusuri siapa yang
merusak apa.

---

## FASE 5 — Menjalankan Satu Task (siklus yang diulang terus)

### Prompt pembuka ke agent
```
Baca SPEC.md, ARCHITECTURE.md, STYLE.md, AGENTS.md dulu.
Lalu kerjakan issue #4.

Batasan:
- Hanya boleh mengubah file yang disebut di issue #4
- Tiru struktur server/controllers/AuthController.js
- Jangan menambah dependency apa pun
- Kalau ada yang tidak jelas di ARCHITECTURE.md, BERHENTI dan tanya saya

Sebelum menulis kode, tunjukkan dulu rencanamu:
file apa yang dibuat/diubah, dan fungsi apa saja di dalamnya.
```

### Alur
1. Agent kirim rencana → **kamu baca dan approve/koreksi**
2. Agent menulis kode
3. Agent jalankan `npm test`, tunjukkan output
4. `git commit` + `git push`
5. Buka PR di GitHub
6. **Kamu review** (lihat checklist di bawah)
7. Merge kalau lolos, atau minta revisi

### Checklist review (5–10 menit per PR)
- [ ] Diff-nya < 200 baris? Kalau tidak, tolak dan minta dipecah
- [ ] Ada file di luar scope yang tersentuh?
- [ ] `package.json` berubah tanpa izin?
- [ ] Ada `console.log` sisa debugging?
- [ ] Ada secret ter-hardcode?
- [ ] Gaya kodenya sesuai `STYLE.md`?
- [ ] Test-nya benar-benar menguji sesuatu, atau cuma `expect(200)`?
- [ ] **Bisakah kamu jelaskan alur kode ini ke orang lain?** Kalau tidak, jangan merge.

---

## FASE 6 — Setelah Merge

```bash
git checkout main && git pull
git worktree remove ../inv-claude
git worktree add ../inv-claude -b feat/7-stock-movement
```

Selalu `git pull` sebelum memulai task berikutnya, dan **beri tahu agent** bahwa
`main` sudah berubah, supaya dia tidak bekerja di atas asumsi lama.

---

## FASE 7 — Deploy

- Backend → Railway/Render, DB → PostgreSQL managed
- Frontend → Vercel, `VITE_API_URL` dari env
- Jalankan migration di production lewat script, bukan `sequelize.sync({ force: true })`
- Antigravity yang menulis dokumentasi deploy di `docs/DEPLOYMENT.md`

---

## Tanda Bahaya (agent mulai halu)

Hentikan dan reset sesi kalau melihat:

- Menyebut nama file atau fungsi yang tidak ada di repo
- Menambah library yang tidak diminta
- Bilang "sudah saya test" tanpa menunjukkan output
- Mengubah isi test supaya lulus
- PR tiba-tiba 800 baris padahal task-nya kecil
- Mengedit file di luar wilayahnya
- Menjawab "sudah sesuai spesifikasi" tanpa menyebut bagian mana

Cara reset: mulai sesi baru, suruh baca ulang `SPEC.md` + `ARCHITECTURE.md` +
file yang relevan, dan kerjakan ulang dari `main` yang bersih.

---

## Prioritas Waktu Reviewmu

Tidak semua kode setara. Baca baris-per-baris untuk:

1. `AuthController` dan middleware `authentication`/`authorization`
2. Alur transaksi stok (`POST /api/sales`, `POST /api/purchases`)
3. Apa pun yang menyentuh `.env` atau query database

Sisanya (form React, styling, CRUD sederhana) cukup dibaca cepat.
