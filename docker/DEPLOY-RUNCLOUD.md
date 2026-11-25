# Deploy di RunCloud Docker Stacks

Satu stack RunCloud (server tipe **Containerized**) berisi 11 container dari image `ghcr.io/yogaro/…`. RunCloud tidak
mengimpor file compose dan tidak punya `depends_on`/perintah per container, jadi dipakai image varian `sgn-stack-*`:
setiap image membaca **Stack Environment Variables** yang sama, menurunkan pengaturannya sendiri
(`docker/stack/entrypoint.sh`), menunggu dependensinya, dan menjalankan migrasi sebelum server. Bootstrap (superadmin
IAM, klien layanan, kunci Directory, login Directory) dijalankan container `iam` setiap start.

## 1. Image

Sama dengan `DEPLOY-STACK.md` langkah 1: secret `REPOS_READ_TOKEN` di `sgn-deploy`, lalu Actions → **images** → Run
workflow. Job `build` membuat image dasar, job `stack` membuat varian `sgn-stack-*` di atasnya.

## 2. Registry di RunCloud

Settings → **Registry Credentials** → Add Credential:
- Provider: **GitHub Container Registry**;
- Username: `yogaro`;
- Password / Token: classic PAT `read:packages`.

## 3. Stack Environment Variables

Isi sekali di bagian **Stack Environment Variables** (Add from .env). Buat nilainya di server atau mesin Linux:

```bash
r() { openssl rand -hex "$1"; }
S3_ACCESS=$(r 12); S3_SECRET=$(r 24)
cat <<EOF
PORTAL_DOMAIN=portal.sgn.co.id
LMS_DOMAIN=sugarledge.sgn.co.id
DIRECTORY_DOMAIN=directory.sgn.co.id
POSTGRES_USER=sgn
POSTGRES_PASSWORD=$(r 24)
S3_ACCESS_KEY=$S3_ACCESS
S3_SECRET_KEY=$S3_SECRET
RUSTFS_ACCESS_KEY=$S3_ACCESS
RUSTFS_SECRET_KEY=$S3_SECRET
IAM_SIGNING_KEY=$(openssl rand -base64 32)
HR_IAM_CLIENT_SECRET=$(r 24)
LMS_IAM_CLIENT_SECRET=$(r 24)
DIRECTORY_SERVICE_KEY=$(r 24)
ADMIN_LOGIN=SUPERADMIN
ADMIN_PASSWORD=GANTI
DIRECTORY_ADMIN_EMAIL=admin.directory@sgn.co.id
DIRECTORY_ADMIN_PASSWORD=GANTI
EOF
```

- Ganti domain dan tiga nilai akun (sandi tanpa spasi). Simpan salinannya, karena dipakai lagi saat seed.
- `ALLOWED_ORIGIN`, `DATABASE_URL`, `IAM_CLIENT_*`, `S3_BUCKET`, dan `S3_PUBLIC_URL` **jangan** diisi di sini; image
  menurunkannya per layanan.
- `IAM_SIGNING_KEY` jangan diganti setelah live (semua sesi keluar).
- Env stack terlihat oleh semua container. Kalau kunci IAM ingin dipisah, buat Secret RunCloud, pasang hanya di
  container `iam` (mis. `/run/secrets/iam-signing-key`), tambahkan env `SIGNING_KEY_PATH` dengan path itu di container
  `iam`, lalu hapus `IAM_SIGNING_KEY` dari env stack.

## 4. Container (Deploy Stack → Custom Image, satu per baris)

Nama container dipakai sebagai hostname antar-container; ketik **persis** seperti kolom Nama.

| Nama | Image (`ghcr.io/yogaro/…:latest`) | Volume | Domain (Enable HTTPS) → port |
| --- | --- | --- | --- |
| `postgres` | `sgn-postgres` | named `sgn-pgdata` → `/var/lib/postgresql/data` | — |
| `s3` | `rustfs/rustfs:1.0.0` (Docker Hub) | named `sgn-s3data` → `/data` | — |
| `iam` | `sgn-stack-iam` | — | — |
| `directory` | `sgn-stack-directory` | — | — |
| `hr` | `sgn-stack-hr` | — | — |
| `hr-worker` | `sgn-stack-hr-worker` | — | — |
| `lms` | `sgn-stack-lms` | — | — |
| `lms-worker` | `sgn-stack-lms-worker` | — | — |
| `portal` | `sgn-portal` | — | `PORTAL_DOMAIN` → 80 |
| `lms-fe` | `sgn-lms-fe` | — | `LMS_DOMAIN` → 80 |
| `directory-fe` | `sgn-stack-directory-fe` | — | `DIRECTORY_DOMAIN` → 80 |

RunCloud mewajibkan port per container. Container tanpa domain di tabel diisi port yang didengarkannya, dan dikunci
dengan **IP Allowlist** `127.0.0.1` supaya domain sementara yang dibuat RunCloud tidak bisa dibuka dari internet
(lalu lintas antar-container tidak lewat proxy, jadi tidak terpengaruh):

| Nama | Port |
| --- | --- |
| `postgres` | 5432 |
| `s3` | 9000 |
| `iam` | 8081 |
| `directory` | 8080 |
| `hr` | 8082 |
| `lms` | 8083 |
| `hr-worker`, `lms-worker` | 9091 (metrics) |
| `portal`, `lms-fe`, `directory-fe` | 80 (dengan domain dan HTTPS, tanpa allowlist) |

Stack Name: `sgn` → **Deploy Stacks**. Urutan start tidak perlu diatur; setiap container menunggu sendiri:
- `iam`: migrasi → bootstrap → server;
- `hr`/`lms`: tunggu `iam` sehat → migrasi → server;
- worker: tunggu server-nya sehat.

Log `iam` memuat `bootstrap ok: …`. Postgres membuat 4 database dan skema Directory hanya saat volume masih kosong.

`sgn-postgres` membuat 4 database dan menerapkan migrasi Directory yang belum tercatat **setiap start**
(`docker/postgres/ensure.sh`), jadi volume yang persiapan pertamanya terputus akan lengkap sendiri pada start berikutnya.
Untuk container ini pasang Readiness Health Check `pg_isready -U sgn -d db_directory` (Start Period 180).

Hostname antar-container = nama service di manifest (Deployments → View Details). Kalau namanya bukan nama di tabel
(mis. `sgn-postgres`, `sgn-stack-iam`, `rustfs`), tambahkan ke env stack:
`PGHOST`, `IAM_URL`, `LMS_URL`, `HR_URL`, `S3_ENDPOINT`, `DIRECTORY_INTERNAL_URL`, `IAM_UPSTREAM`, `LMS_UPSTREAM`,
`HR_UPSTREAM`, `S3_UPSTREAM`, `DIRECTORY_UPSTREAM` (format `http://<nama>:<port>`, `PGHOST` hanya nama).
Variabel yang sama per kelompok:
- backend: `PGHOST`, `IAM_URL`, `S3_ENDPOINT`, `DIRECTORY_INTERNAL_URL`, `HR_URL`, `LMS_URL`;
- frontend: `IAM_UPSTREAM`, `HR_UPSTREAM`, `LMS_UPSTREAM`, `S3_UPSTREAM`, `DIRECTORY_UPSTREAM`.

## 5. Seed (sekali, SSH ke server)

Butuh Node 22 di host (`node -v`). Data karyawan dikirim terpisah (`sgn-seed-data.tar.gz`).

```bash
git clone https://github.com/yogaro/sgn-deploy.git /opt/sgn && cd /opt/sgn
tar -xzf /lokasi/sgn-seed-data.tar.gz -C /opt/sgn
export SEED_PG_CONTAINER=$(docker ps --format '{{.Names}}' | grep '_postgres\.' | head -1)
export SEED_IAM_CONTAINER=$(docker ps --format '{{.Names}}' | grep '_iam\.' | head -1)
export LMS_BASE=https://sugarledge.sgn.co.id
echo "$SEED_PG_CONTAINER / $SEED_IAM_CONTAINER"
SEED_PASSWORD='…' SEED_MUST_CHANGE=1 seed/run.sh --formasi
```

Setelah itu restart container `hr-worker` dari dasbor RunCloud, agar HR langsung sinkron dari IAM (kalau tidak,
menunggu sampai 1 jam). Akun hasil seed: `DEPLOY-VPS.md` → Seed.

### Tanpa SSH

`seed/remote.sh` menjalankan seed dari mesin yang punya `seed/data/private/` dan `seed/assets/`:
- sinkron IAM/LMS, media, dan banner lewat API domain LMS;
- file SQL diimpor lewat Adminer (container `adminer:5` sementara di stack: domain + HTTPS, IP Allowlist, Site
  Authentication; server `sgn-postgres`, user `sgn`). Skrip berhenti di tiap impor.

```bash
LMS_BASE=https://sugarledge.sgn.co.id SEED_PASSWORD='…' ADMIN_LOGIN=SUPERADMIN ADMIN_PASSWORD='…' seed/remote.sh
```

Hapus container `adminer` setelah selesai.

## 6. Backup

RunCloud belum punya backup untuk stack. Jalankan dari host (cron):

```bash
PG=$(docker ps --format '{{.Names}}' | grep '_postgres\.' | head -1)
for db in db_iam db_hr db_lms db_directory; do docker exec "$PG" pg_dump -U sgn -Fc "$db" > /backup/$db-$(date +%F).dump; done
```

Media (volume `sgn-s3data`) ikut lewat snapshot server di penyedia VPS.

## Pembaruan

Push ke repo aplikasi → jalankan workflow **images** → redeploy stack di RunCloud (atau pasang Webhooks RunCloud untuk
registry). `latest` selalu build terakhir; untuk deploy yang terkunci, ganti tag image menjadi `run-<n>`.

## Status per 2026-11-24

- **Sudah lolos:**
  - `entrypoint.sh` disimulasikan untuk iam/hr/lms/directory (server dan worker): env per layanan benar, migrasi
    hanya di server, rahasia kosong ditolak;
  - bootstrap diuji terhadap migrasi asli (lihat `DEPLOY-STACK.md`);
  - workflow ter-parse dengan 2 job.
- **Belum teruji:**
  - build `sgn-stack-*` di Actions;
  - hostname antar-container di RunCloud;
  - batas unggah 600 MB dan header `Host` di proxy RunCloud (unggah video kursus dan buka media LMS untuk memastikan);
  - seed lewat `docker exec`.
