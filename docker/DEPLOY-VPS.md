# Deploy VPS

Satu host, Docker Compose (`compose.yaml` + `compose.prod.yaml`). Caddy menangani TLS (ACME HTTP-01); tidak ada port lain
yang dipublikasikan ke publik.

```
:443 caddy ─┬─ ${PORTAL_DOMAIN}/*                              → portal:80   (/api/iam → iam:8081, /api/hr → hr:8082)
            ├─ ${LMS_DOMAIN}/*   (/ → 301 /lms/)               → lms-fe:80   (/api/iam → iam, /api/lms → lms:8083, /lms-files → s3:9000)
            ├─ ${DIRECTORY_DOMAIN}/api/* (prefix dibuang)      → directory:8080
            └─ ${DIRECTORY_DOMAIN}/*                           → directory-fe:80
internal: postgres:5432 (db_iam, db_hr, db_lms, db_directory), s3 (RustFS), hr-worker, lms-worker, *-migrate
loopback: lms-fe 127.0.0.1:3003 (seed), postgres 127.0.0.1:55432
```

Semua panggilan browser same-origin: tiap frontend mem-proxy `/api/*` miliknya sendiri, jadi backend tidak punya host
publik. Cookie refresh IAM (`SameSite=Strict`, `Path=/api/iam/v1/auth`) berlaku per host, sehingga Portal dan LMS punya
sesi masing-masing: masuk dan keluar di satu aplikasi tidak memengaruhi yang lain.

## Kebutuhan

- Ubuntu 22.04/24.04, x86_64, minimal 2 vCPU / 4 GB RAM (disarankan 8 GB; build Go + Vite memuncak sekitar 4 GB),
  disk minimal 60 GB.
- Record A `PORTAL_DOMAIN`, `LMS_DOMAIN`, dan `DIRECTORY_DOMAIN` → host, **sudah resolve sebelum `vps-bootstrap.sh`**
  (Caddy langsung meminta sertifikat); port 80/443 terbuka di firewall penyedia.
- Akses baca dari host ke `yogaro/*` (kunci SSH atau credential helper HTTPS).

## Struktur folder

Hanya `sgn-deploy` yang di-clone manual. `docker/clone-repos.sh` meng-clone 11 repo lain **ke dalamnya**, dengan nama
folder yang dirujuk compose, `go.mod` (`replace ../`), dan `package.json` (`file:../`). Folder `sgn-*` di-ignore
`sgn-deploy`.

```
/opt/sgn                     sgn-deploy
├── sgn-iam-service          sgn-iam-be
├── sgn-iam-contracts        sgn-iam-contracts
├── sgn-hr-service           sgn-hr-be
├── sgn-hr-contracts         sgn-hr-contracts
├── sgn-lms-service          sgn-lms-be
├── sgn-lms-fe               sgn-lms-fe
├── sgn-lms-contracts        sgn-lms-contracts
├── sgn-directory-service    sgn-directory-be
├── sgn-directory-fe         sgn-directory-fe
├── sgn-directory-contracts  sgn-directory-contracts
└── sgn-portal               sgn-portal-fe
```

## File

| File | Fungsi |
| --- | --- |
| `compose.prod.yaml` | Layanan `caddy`; `ports: !reset` di layanan aplikasi; `ALLOWED_ORIGIN` iam/hr = `https://${PORTAL_DOMAIN}`, lms = `https://${LMS_DOMAIN}` (juga alamat verifikasi di PDF sertifikat); `S3_PUBLIC_URL` = `https://${LMS_DOMAIN}`; `COOKIE_SECURE=true`; `VITE_DIRECTORY_SERVICE_URL=https://${DIRECTORY_DOMAIN}/api` (build arg). Butuh Compose ≥ 2.24.4. |
| `docker/caddy/Caddyfile` | Satu blok per domain; batas body 600 MB dan proxy tanpa buffer untuk LMS. |
| `docker/vps-setup.sh` | Docker (get.docker.com), Node 22 (NodeSource), swap 4 GB bila RAM < 8 GB, ufw 22/80/443. |
| `docker/clone-repos.sh` | Clone/pull 11 repo aplikasi ke nama folder yang dirujuk compose. Variabel `GIT_BASE`, `BRANCH`. |
| `docker/vps-bootstrap.sh` | Menulis `.env` dan kunci tanda tangan, build, membuat klien layanan, menyalakan semua. Idempoten. |
| `compose.runcloud.yaml`, `docker/runcloud/*.conf` | Varian RunCloud: Caddy mati, entry point di loopback, config proxy untuk nginx RunCloud (bagian RunCloud). |
| `docker/backup.sh` | `pg_dump -Fc` ×4, tar volume `<project>_s3-data`, `.env`, kunci tanda tangan → `backups/<tanggal>/`; disimpan `KEEP_DAYS` hari (14). |

## Instalasi

```bash
git clone git@github.com:yogaro/sgn-deploy.git /opt/sgn && cd /opt/sgn
sudo bash docker/vps-setup.sh
docker/clone-repos.sh
PORTAL_DOMAIN=portal.example.co.id LMS_DOMAIN=sugarledge.example.co.id DIRECTORY_DOMAIN=directory.example.co.id \
  docker/vps-bootstrap.sh
docker compose run --rm iam createadmin          # SUPERADMIN IAM (Portal + LMS)
docker compose run --rm directory createuser     # login Directory FE
```

Domain bisa juga diisi lebih dulu di `.env` (`cp .env.example .env`; `PORTAL_DOMAIN`, `LMS_DOMAIN`, `DIRECTORY_DOMAIN`),
lalu `docker/vps-bootstrap.sh` tanpa variabel. Mengganti domain kemudian: ubah `.env` + DNS, lalu
`docker compose up -d --build` (`--build` karena domain Directory tertanam di bundle directory-fe).

`vps-bootstrap.sh` mengisi di `.env`:
- `COMPOSE_FILE=compose.yaml:compose.prod.yaml`, sehingga `docker compose` biasa langsung memakai overlay;
- `COOKIE_SECURE=true` dan `LMS_PUBLIC_URL`;
- `POSTGRES_PASSWORD`, `S3_ACCESS_KEY`/`S3_SECRET_KEY`, dan `GRAFANA_ADMIN_PASSWORD` acak, hanya yang masih kosong;
- kredensial klien layanan, dengan mengisi prompt `createserviceclient` lewat pipe:
  - `DIRECTORY_SERVICE_KEY` (IAM → Directory);
  - `HR_IAM_CLIENT_ID`/`SECRET` dan `LMS_IAM_CLIENT_ID`/`SECRET` (scope `iam.employees.read,iam.org.read`).

Skrip juga membuat `docker/secrets/iam-signing-key.txt` (`genkey`) bila belum ada. Nilai yang sudah ada tidak diganti.
Kalau build gagal karena timeout jaringan (`go mod download`, `npm ci`), jalankan ulang skripnya.

## RunCloud

Di server yang dikelola RunCloud, nginx RunCloud memegang 80/443 dan TLS, jadi Caddy dimatikan dan entry point
dipublikasikan di loopback (`compose.runcloud.yaml`):

| Domain | Upstream | Config RunCloud |
| --- | --- | --- |
| `PORTAL_DOMAIN` | `127.0.0.1:3000` (portal) | `docker/runcloud/portal.conf` |
| `LMS_DOMAIN` | `127.0.0.1:3003` (lms-fe) | `docker/runcloud/lms.conf` |
| `DIRECTORY_DOMAIN` | `127.0.0.1:3001` (directory-fe), `/api/` → `127.0.0.1:8080/` (directory) | `docker/runcloud/directory.conf` |

Port mengikuti `PORTAL_PORT`, `LMS_WEB_PORT`, `DIRECTORY_FE_PORT`, `DIRECTORY_PORT` di `.env`; kalau diubah, ubah juga
`proxy_pass` di config RunCloud.

```bash
sudo PROXY=runcloud bash docker/vps-setup.sh     # tanpa ufw; firewall diurus RunCloud
docker/clone-repos.sh
PROXY=runcloud PORTAL_DOMAIN=… LMS_DOMAIN=… DIRECTORY_DOMAIN=… docker/vps-bootstrap.sh
```

`PROXY=runcloud` tersimpan lewat `COMPOSE_FILE` di `.env`, jadi bootstrap ulang dan `docker compose` berikutnya tetap tanpa
Caddy. Lalu di dasbor RunCloud, untuk tiap domain:

1. Web Application baru dengan domain itu; Settings → Web Application Stack **Native NGiNX + Custom Config**.
2. SSL/TLS → Let's Encrypt.
3. NGiNX Config → Add a New Config → Predefined Config → **Proxy**; ganti isinya dengan file `docker/runcloud/*.conf`
   yang sesuai → Run and Debug → Create Config.

Firewall RunCloud: buka 22, 80, 443 saja. Port 3000/3001/3003/8080 hanya di `127.0.0.1`, tidak perlu dibuka.

## Seed (FORMASI + modul piloting)

Data karyawan asli dan media tidak ada di git. Keduanya dikirim terpisah sebagai `sgn-seed-data.tar.gz` (sekitar 254 MB):
`seed/data/private/` (formasi.json, people.json, positions.json), `seed/assets/` (media.json, manifest.json, cover, PDF
piloting, video), dan `Trailer Sugartime.mp4` (banner halaman masuk). Ekstrak di root repo:

```bash
tar -xzf sgn-seed-data.tar.gz -C /opt/sgn
ls /opt/sgn/seed/data/private /opt/sgn/seed/assets/media.json
```

`seed/data/private/` berisi data pribadi karyawan: hapus arsipnya setelah diekstrak.

```bash
SEED_PASSWORD='…' SEED_MUST_CHANGE=1 seed/run.sh --formasi
docker compose restart hr-worker    # HR sinkron IAM saat worker start; tanpa ini data karyawan HR menunggu sampai 1 jam
```

Urutan seed: Directory (SQL) → `iam sync --full` → peran dan sandi IAM → sinkron LMS → media → data LMS → banner.

- Setiap karyawan FORMASI dan `DEMO-*-01` mendapat `SEED_PASSWORD` dengan `must_change_password=true`.
- `ADMIN-LMS` mendapat sandi yang sama dengan `must_change_password=false`, karena seed masuk memakai akun ini.
- Hash bcrypt dibuat pgcrypto di container postgres.
- `SEED_MUST_CHANGE` tanpa `SEED_PASSWORD` ditolak, karena sandi bawaan `Demo#Sgn2026` ada di repo.
- `--formasi` membangun ulang tabel domain LMS (`01_reset_lms_domain.sql`). Jangan jalankan ulang setelah piloting
  punya data.

## Verifikasi

- `docker compose ps`: semua layanan `healthy`, `*-migrate` `exited (0)`.
- `https://${LMS_DOMAIN}/`: dialihkan ke `/lms/`; masuk sebagai `ADMIN-LMS`; buka satu kursus PDF/video (menguji
  `S3_PUBLIC_URL` + `Host`).
- Masuk LMS dengan NIK karyawan + `SEED_PASSWORD`: harus diminta ganti sandi.
- `https://${PORTAL_DOMAIN}/`: masuk Portal dengan akun `createadmin`; unggah satu lampiran cuti (menguji bucket `hr-files`).
- `https://${DIRECTORY_DOMAIN}/`: masuk dengan akun `createuser`.
- `docker/backup.sh` sekali; periksa isi `backups/<tanggal>/`.

## Masalah umum

| Gejala | Penyebab / tindakan |
| --- | --- |
| Sertifikat tidak terbit | `docker compose logs caddy`; DNS belum mengarah ke host, atau 80/443 diblokir firewall penyedia. |
| Build gagal `TLS handshake timeout` | Jaringan saat `go mod download`/`npm ci`; jalankan ulang `vps-bootstrap.sh` / `docker compose build`. |
| `permission denied` ke Docker socket | User baru masuk grup `docker` oleh `vps-setup.sh`; logout lalu login lagi. |
| Situs tidak terbuka / sertifikat salah host | Domain di `.env` beda dengan alamat yang dibuka; perbaiki lalu `docker compose up -d`. |
| Media 403 `SignatureDoesNotMatch` | `LMS_PUBLIC_URL` ≠ `https://${LMS_DOMAIN}`, atau proxy di depan Caddy mengubah `Host`. |
| Alamat di PDF sertifikat salah | `ALLOWED_ORIGIN` lms mengikuti `LMS_DOMAIN`; sertifikat yang sudah terbit tidak berubah. |
| HR kosong setelah seed | `docker compose restart hr-worker`. |

## Pembaruan

```bash
cd /opt/sgn
git pull && docker/clone-repos.sh   # clone-repos.sh = git pull --ff-only untuk repo yang sudah ada
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
