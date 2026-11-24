# Deploy lewat panel (stack + image registry)

Untuk panel yang men-deploy "stack" compose dari image jadi (tanpa build, tanpa file repo). Image dibangun GitHub Actions
`sgn-deploy` dan disimpan di GitHub Container Registry (privat). Kalau server bisa diakses SSH dan boleh build sendiri,
`DEPLOY-VPS.md` lebih sederhana. RunCloud Docker Stacks (wizard per container, tanpa impor compose): `DEPLOY-RUNCLOUD.md`.

```
GitHub Actions (images.yml) ──push──▶ ghcr.io/yogaro/sgn-*:latest, :run-<n>
panel ──pull──▶ compose.stack.yaml + env ──▶ 127.0.0.1:3000 portal · :3003 lms-fe · :3001 directory-fe · :8080 directory
reverse proxy (RunCloud, TLS) ──▶ PORTAL_DOMAIN · LMS_DOMAIN · DIRECTORY_DOMAIN (/api/ → :8080)
```

| File | Fungsi |
| --- | --- |
| `.github/workflows/images.yml` | Build 8 image dari branch `main` 11 repo aplikasi, push ke `ghcr.io/<owner>/…` (`latest`, `run-<nomor run>`). Manual (`workflow_dispatch`). |
| `docker/postgres/Dockerfile` | `sgn-postgres`: Postgres 17 + init 4 database + skema Directory + skrip `sgn-bootstrap`. |
| `docker/postgres/bootstrap.sh` | Job `bootstrap` (tiap deploy, idempoten): superadmin IAM, klien `svc-sgn-hr-service`/`svc-sgn-lms-service`, kunci Directory untuk IAM, login Directory. Menggantikan `createadmin`, `createserviceclient`, `createuser`. |
| `compose.stack.yaml` | Stack mandiri: image dari registry, tanpa `build`/bind mount, entry point di loopback. |
| `stack.env.example` | Semua variabel stack. |
| `docker/runcloud/*.conf` | Config proxy RunCloud (sama dengan `DEPLOY-VPS.md` → RunCloud). |

## 1. Image (sekali, lalu tiap ada perubahan kode)

1. Fine-grained PAT, resource owner `yogaro`, **Contents: Read-only** di 11 repo aplikasi → secret `REPOS_READ_TOKEN` di
   repo `sgn-deploy` (Settings → Secrets and variables → Actions).
2. Actions → **images** → Run workflow (branch app `main`). Hasil: 8 package di `github.com/yogaro?tab=packages`, privat.
3. Untuk panel: **classic** PAT dengan scope `read:packages` (GHCR belum menerima fine-grained PAT untuk pull).

Setelah push kode aplikasi, jalankan lagi workflow ini lalu redeploy stack (pull ulang). `IMAGE_TAG=run-<n>` mengunci
deploy ke satu build; `latest` selalu build terakhir.

## 2. Env

```bash
cp stack.env.example stack.env
openssl rand -hex 24      # POSTGRES_PASSWORD, S3_SECRET_KEY, HR_IAM_CLIENT_SECRET, LMS_IAM_CLIENT_SECRET, DIRECTORY_SERVICE_KEY
openssl rand -hex 12      # S3_ACCESS_KEY
openssl rand -base64 32   # IAM_SIGNING_KEY
```

Isi juga domain, `ADMIN_LOGIN`/`ADMIN_PASSWORD` (superadmin Portal + LMS), dan `DIRECTORY_ADMIN_EMAIL`/
`DIRECTORY_ADMIN_PASSWORD` (login Directory). Akun hanya dibuat bila belum ada; sandi yang diganti di aplikasi tidak
ditimpa. `IAM_SIGNING_KEY` jangan diganti setelah live (semua sesi keluar).

## 3. Panel

1. Registry: `ghcr.io`, username akun GitHub pemilik PAT, password = PAT `read:packages`.
2. Stack baru: isi dengan `compose.stack.yaml`, environment dari `stack.env`. Nama stack bebas (dipakai lagi di langkah 5).
3. Deploy. Urutan: `postgres` → `iam-migrate` → `bootstrap` → `iam`, `directory` → migrasi + layanan HR/LMS → frontend.
   `bootstrap` harus `exited (0)`; log-nya diakhiri `bootstrap ok: …`.

## 4. Domain dan TLS

Reverse proxy di depan (RunCloud: tiga web app, Native NGiNX + Custom Config, Let's Encrypt, Predefined Config **Proxy**
diganti isi `docker/runcloud/portal.conf`, `lms.conf`, `directory.conf`). Upstream: `127.0.0.1:3000`, `:3003`, `:3001`
(+ `/api/` → `:8080`). Directory FE di image ini memanggil `/api` relatif, jadi `/api/` di domain Directory wajib diproxy.

## 5. Seed (sekali, butuh terminal di server)

Data karyawan asli tidak boleh masuk image, jadi seed dijalankan dari terminal server (SSH atau console panel), dengan
Node 22 dan Docker CLI yang mengakses Docker host yang sama:

```bash
git clone git@github.com:yogaro/sgn-deploy.git /opt/sgn && cd /opt/sgn     # app repo tidak perlu
cp /path/stack.env .env
printf 'COMPOSE_FILE=compose.stack.yaml\nCOMPOSE_PROJECT_NAME=<nama stack di panel>\n' >> .env
tar -xzf sgn-seed-data.tar.gz -C /opt/sgn && rm sgn-seed-data.tar.gz
SEED_PASSWORD='…' SEED_MUST_CHANGE=1 seed/run.sh --formasi
docker compose restart hr-worker
```

`COMPOSE_PROJECT_NAME` harus sama dengan nama stack di panel, supaya `docker compose exec/run` mengenai container stack
itu. Detail akun hasil seed: `DEPLOY-VPS.md` → Seed.

## Verifikasi

Sama dengan `DEPLOY-VPS.md` → Verifikasi, dengan akun `ADMIN_LOGIN` (Portal/LMS) dan `DIRECTORY_ADMIN_EMAIL` (Directory).

## Catatan

- Skema Directory hanya dibuat saat volume `pgdata` masih kosong (init Postgres). Migrasi Directory baru pada volume
  lama dijalankan manual dengan `psql`, sama seperti stack biasa.
- Backup: `docker/backup.sh` dari `/opt/sgn` dengan `.env` di atas (memakai `COMPOSE_PROJECT_NAME`).
- Status per 2026-11-24:
  - **Sudah lolos:**
    - `docker compose config` untuk `compose.stack.yaml`: 0 `build`, 0 bind mount, semua port di `127.0.0.1`;
    - `bootstrap.sh` dijalankan 3× terhadap migrasi IAM dan Directory asli: idempoten, rotasi rahasia jalan;
    - hash bootstrap diterima bcrypt IAM;
    - hash kunci Directory sama dengan sha256 Directory.
  - **Belum teruji:** `images.yml` di GitHub Actions, pull dari ghcr oleh panel, dan stack penuh di server.
