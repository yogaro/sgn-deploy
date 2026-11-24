# Deploy VPS

Satu host, Docker Compose (`compose.yaml` + `compose.prod.yaml`). Caddy menangani TLS (ACME HTTP-01); tidak ada port lain
yang dipublikasikan ke publik.

```
:443 caddy ─┬─ ${SGN_DOMAIN}/                                  → portal:80   (/api/iam → iam:8081, /api/hr → hr:8082)
            ├─ ${SGN_DOMAIN}/{lms,api/lms,lms-files}/*         → lms-fe:80   (/api/iam → iam, /api/lms → lms:8083, /lms-files → s3:9000)
            ├─ ${DIRECTORY_DOMAIN}/api/* (prefix dibuang)      → directory:8080
            └─ ${DIRECTORY_DOMAIN}/*                           → directory-fe:80
internal: postgres:5432 (db_iam, db_hr, db_lms, db_directory), s3 (RustFS), hr-worker, lms-worker, *-migrate
loopback: lms-fe 127.0.0.1:3003 (seed), postgres 127.0.0.1:55432
```

Portal dan LMS sengaja satu origin, karena cookie refresh IAM `SameSite=Strict` dengan `Path=/api/iam/v1/auth`.

## Kebutuhan

- Ubuntu 22.04/24.04, x86_64, minimal 2 vCPU / 4 GB RAM (disarankan 8 GB; build Go + Vite memuncak sekitar 4 GB),
  disk minimal 60 GB.
- Record A `SGN_DOMAIN` dan `DIRECTORY_DOMAIN` → host; port 80/443 terbuka di firewall penyedia.
- Akses baca dari host ke `yogaro/*` (kunci SSH atau credential helper HTTPS).

## File

| File | Fungsi |
| --- | --- |
| `compose.prod.yaml` | Layanan `caddy`; `ports: !reset` di layanan aplikasi; `ALLOWED_ORIGIN`/`S3_PUBLIC_URL` = `https://${SGN_DOMAIN}`; `COOKIE_SECURE=true`; `VITE_DIRECTORY_SERVICE_URL=https://${DIRECTORY_DOMAIN}/api` (build arg). Butuh Compose ≥ 2.24.4. |
| `docker/caddy/Caddyfile` | Rute di atas; batas body 600 MB dan proxy tanpa buffer untuk media LMS. |
| `docker/vps-setup.sh` | Docker (get.docker.com), Node 22 (NodeSource), swap 4 GB bila RAM < 8 GB, ufw 22/80/443. |
| `docker/clone-repos.sh` | Clone/pull 11 repo aplikasi ke nama folder yang dirujuk compose. Variabel `GIT_BASE`, `BRANCH`. |
| `docker/vps-bootstrap.sh` | Menulis `.env` dan kunci tanda tangan, build, membuat klien layanan, menyalakan semua. Idempoten. |
| `docker/backup.sh` | `pg_dump -Fc` ×4, tar volume `<project>_s3-data`, `.env`, kunci tanda tangan → `backups/<tanggal>/`; disimpan `KEEP_DAYS` hari (14). |

## Instalasi

```bash
git clone git@github.com:yogaro/sgn-deploy.git /opt/sgn && cd /opt/sgn
sudo bash docker/vps-setup.sh
docker/clone-repos.sh
SGN_DOMAIN=sgn.example.co.id DIRECTORY_DOMAIN=directory.example.co.id docker/vps-bootstrap.sh
docker compose run --rm iam createadmin          # SUPERADMIN IAM (Portal + LMS)
docker compose run --rm directory createuser     # login Directory FE
```

`vps-bootstrap.sh` mengisi di `.env`:
- `COMPOSE_FILE=compose.yaml:compose.prod.yaml`, sehingga `docker compose` biasa langsung memakai overlay;
- `COOKIE_SECURE=true` dan `LMS_PUBLIC_URL`;
- `POSTGRES_PASSWORD`, `S3_ACCESS_KEY`/`S3_SECRET_KEY`, dan `GRAFANA_ADMIN_PASSWORD` acak, hanya yang masih kosong;
- kredensial klien layanan, dengan mengisi prompt `createserviceclient` lewat pipe:
  - `DIRECTORY_SERVICE_KEY` (IAM → Directory);
  - `HR_IAM_CLIENT_ID`/`SECRET` dan `LMS_IAM_CLIENT_ID`/`SECRET` (scope `iam.employees.read,iam.org.read`).

Skrip juga membuat `docker/secrets/iam-signing-key.txt` (`genkey`) bila belum ada. Nilai yang sudah ada tidak diganti.
Kalau build gagal karena timeout jaringan (`go mod download`, `npm ci`), jalankan ulang skripnya.

## Seed (FORMASI + modul piloting)

Tidak ada di git; salin dari mesin yang menyimpannya:

```bash
rsync -az seed/data/private/ HOST:/opt/sgn/seed/data/private/   # formasi.json, people.json, positions.json
rsync -az seed/assets/       HOST:/opt/sgn/seed/assets/         # ~275 MB, termasuk media.json dan PDF piloting
scp "Trailer Sugartime.mp4"  HOST:/opt/sgn/                     # video banner halaman masuk
```

```bash
SEED_PASSWORD='…' SEED_MUST_CHANGE=1 seed/run.sh --formasi
```

- Setiap karyawan FORMASI dan `DEMO-*-01` mendapat `SEED_PASSWORD` dengan `must_change_password=true`.
- `ADMIN-LMS` mendapat sandi yang sama dengan `must_change_password=false`, karena seed masuk memakai akun ini.
- Hash bcrypt dibuat pgcrypto di container postgres.
- `SEED_MUST_CHANGE` tanpa `SEED_PASSWORD` ditolak, karena sandi bawaan `Demo#Sgn2026` ada di repo.
- `--formasi` membangun ulang tabel domain LMS (`01_reset_lms_domain.sql`). Jangan jalankan ulang setelah piloting
  punya data.

## Pembaruan

```bash
git pull && docker/clone-repos.sh
docker compose up -d --build        # *-migrate jalan sebelum layanannya (depends_on: service_completed_successfully)
docker image prune -f
```

## Backup / restore

```bash
0 2 * * * cd /opt/sgn && BACKUP_REMOTE=backup@HOST:/srv/sgn docker/backup.sh >> backups/backup.log 2>&1   # crontab
docker compose exec -T postgres pg_restore -U sgn -d db_lms --clean < backups/<tanggal>/db_lms.dump
docker run --rm -v sgn_s3-data:/data -v "$PWD/backups/<tanggal>":/in alpine tar xzf /in/s3-data.tar.gz -C /data
```

`BACKUP_REMOTE` mengirim setiap backup baru ke luar host lewat rsync over SSH (autentikasi kunci, `BatchMode`); tanpa
itu backup hanya ada di host.

## Pemantauan

`docker compose --profile monitoring up -d`. Grafana mendengarkan di `127.0.0.1:3002` (akses lewat tunnel SSH); user
`admin`, sandi `GRAFANA_ADMIN_PASSWORD`.

## Catatan

- Port yang dipublikasikan Docker melewati ufw. Hanya `caddy` yang dipublikasikan di `0.0.0.0`; pertahankan begitu.
- URL media bertanda tangan ditandatangani untuk host `S3_PUBLIC_URL`. Caddy dan nginx `lms-fe` meneruskan `Host` tanpa
  diubah; proxy yang mengubah `Host` membuat media gagal dimuat.
- Status per 2026-11-24:
  - **Belum teruji di host sungguhan:** Caddyfile, `vps-bootstrap.sh` dari awal sampai akhir, dan seed dengan
    `SEED_PASSWORD`.
  - **Sudah lolos:** `docker compose config` dengan overlay, tes integrasi S3 HR terhadap RustFS, dan hash pgcrypto yang
    diterima bcrypt IAM.
