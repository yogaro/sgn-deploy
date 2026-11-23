# Docker — SGN stack

`compose.yaml` (folder ini: root workspace) menjalankan semua service:

| Service        | Image                   | Port host (default) | Isi                                          |
| -------------- | ----------------------- | ------------------- | -------------------------------------------- |
| `postgres`     | `postgres:17-alpine`    | `127.0.0.1:55432`   | `db_iam`, `db_hr`, `db_lms`, `db_directory`  |
| `iam-migrate`  | `sgn-iam-service`       | —                   | migrasi IAM, sekali jalan                    |
| `iam`          | `sgn-iam-service`       | `8081`              | IAM API                                      |
| `hr-migrate`   | `sgn-hr-service`        | —                   | migrasi HR, sekali jalan                     |
| `hr`           | `sgn-hr-service`        | `8082`              | HR API (lampiran di bucket S3 `hr-files`)    |
| `hr-worker`    | `sgn-hr-service`        | —                   | sync IAM berkala + job harian absensi        |
| `lms-migrate`  | `sgn-lms-service`       | —                   | migrasi LMS, sekali jalan                    |
| `lms`          | `sgn-lms-service`       | `8083`              | LMS API                                      |
| `lms-worker`   | `sgn-lms-service`       | —                   | sync IAM berkala + bersih-bersih media harian |
| `s3`           | `rustfs/rustfs`         | — (hanya lewat `lms-fe`) | penyimpanan video/PDF/gambar kursus (volume `s3-data`) |
| `directory`    | `sgn-directory-service` | `8080`              | Directory API                                |
| `portal`       | `sgn-portal`            | `3000`              | Portal (nginx; `/api/iam`, `/api/hr` diproxy) |
| `lms-fe`       | `sgn-lms-fe`            | `3003`              | SUGARLedge (nginx; `/api/iam`, `/api/lms`, `/lms-files` diproxy) |
| `directory-fe` | `sgn-directory-fe`      | `3001`              | Directory FE (nginx)                         |

Setiap image dibangun dari root workspace karena `go.mod`/`package.json`
service menunjuk contracts di `../`. Tiap repo punya `Dockerfile` dan
`Dockerfile.dockerignore` sendiri; `.env`, `signing-key.txt`, `tmp/`,
`storage/`, dan `node_modules` tidak pernah masuk image.

## Pertama kali

```bash
cp .env.example .env            # isi POSTGRES_PASSWORD (huruf & angka saja)
docker compose build
docker run --rm sgn-iam-service genkey > docker/secrets/iam-signing-key.txt
docker compose up -d
docker compose ps               # semua service "healthy", migrate "exited (0)"
```

Buka Portal di <http://localhost:3000>, SUGARLedge di <http://localhost:3003/lms/>, Directory FE di <http://localhost:3001>.

Kalau server dev lokal (8080–8082, 5174) sedang jalan, ganti port di `.env`
dulu (mis. `IAM_PORT=18081`) — atau hentikan server lokalnya.

## Bootstrap data (database baru)

Database baru berisi skema saja. Perintah interaktif dijalankan di image
yang sama:

```bash
# Akun superadmin IAM pertama (non-karyawan, role SUPERADMIN) — tanya Login ID & password.
# Membuka Portal dan LMS; Directory FE punya akun sendiri (createuser di bawah).
docker compose run --rm iam createadmin

# Client sync HR → IAM; salin id & secret ke HR_IAM_CLIENT_ID/SECRET di .env
docker compose run --rm iam createserviceclient

# Client sync LMS → IAM (nama sgn-lms-service, scope iam.employees.read,iam.org.read);
# salin id & secret ke LMS_IAM_CLIENT_ID/SECRET di .env
docker compose run --rm iam createserviceclient

# Service key IAM → Directory; salin ke DIRECTORY_SERVICE_KEY di .env
docker compose run --rm directory createserviceclient

# Akun login Directory FE
docker compose run --rm directory createuser

docker compose up -d            # ulang supaya env baru terbaca
```

Data organisasi masuk ke IAM lewat sync Directory (Admin IAM → Sync
Directory), lalu ke HR lewat `hr-worker` atau Admin HR → Sync IAM.

## Rebuild setelah mengubah kode

Lihat [REBUILD.md](REBUILD.md).

## Catatan

- Skema directory diterapkan oleh `docker/postgres/initdb/` **hanya saat
  volume `pgdata` masih kosong** (service itu belum punya perintah
  migrate). Migrasi directory baru di volume yang sudah ada: jalankan
  file-nya dengan `psql` seperti biasa.
- IAM dan HR menjalankan `migrate` setiap `up`; migrasi yang sudah
  tercatat dilewati.
- Kunci signing IAM di-mount sebagai secret (`/run/secrets/iam_signing_key`),
  tidak di-bake ke image. `docker/secrets/` di-ignore git.
- Directory FE memanggil directory service langsung dari browser, jadi URL
  publiknya (`http://localhost:${DIRECTORY_PORT}`) ditanam saat build;
  ganti port → `docker compose build directory-fe`.
- nginx Portal me-resolve ulang nama `iam`/`hr` lewat DNS Docker
  (`127.0.0.11`), jadi restart backend tidak perlu restart `portal`.
- Semua layanan dan FE punya `build` sendiri. Layanan pendamping memakai image yang sama dengan induknya
  (`pull_policy: never`): `iam-migrate` dengan `iam`, `hr-migrate` dan `hr-worker` dengan `hr`, `lms-migrate` dan
  `lms-worker` dengan `lms`. Setelah mengubah kode: `docker compose build iam hr lms` lalu `up -d` (semua layanan,
  supaya pendampingnya ikut memakai image baru).
- `hr-worker` berhenti kalau `HR_IAM_CLIENT_ID`/`SECRET` kosong — buat
  client-nya dulu (lihat Bootstrap).
- Hapus semuanya termasuk data: `docker compose down -v`.

## LMS dan penyimpanan media

- `S3_ACCESS_KEY` / `S3_SECRET_KEY` di `.env` (huruf dan angka, 12+ karakter)
  dipakai `s3` dan `lms`; compose menolak jalan kalau kosong.
- Volume Postgres lama tidak menjalankan `initdb` lagi, jadi buat databasenya
  sekali: `docker compose exec postgres psql -U sgn -d postgres -c "CREATE DATABASE db_lms"`.
- Browser mengunggah dan memutar media lewat URL bertanda tangan ke
  `http://localhost:3003/lms-files/...`; nginx `lms-fe` meneruskannya ke `s3`
  dengan `Host` dan path utuh (tanda tangan mencakup keduanya). Karena itu
  `LMS_PUBLIC_URL` harus sama dengan alamat yang dipakai membuka LMS. Kalau
  LMS dibuka lewat alamat lain (ngrok, IP lain), ubah `LMS_PUBLIC_URL` dan
  `docker compose up -d lms`.
- Port `s3` tidak dibuka ke host. File yang dihapus dari aplikasi masuk
  folder sampah internal RustFS dulu, jadi ruang disk turun belakangan.

## Monitoring (Prometheus, Loki, Grafana)

Stack monitoring ada di profil compose terpisah, jadi `docker compose up -d`
biasa tidak menjalankannya:

```sh
docker compose --profile monitoring up -d
```

| Service             | Port host (default) | Isi                                                            |
| ------------------- | ------------------- | -------------------------------------------------------------- |
| `grafana`           | `127.0.0.1:3002`    | dashboard; login `admin` + `GRAFANA_ADMIN_PASSWORD` dari `.env` |
| `prometheus`        | `127.0.0.1:9090`    | metrik 15 hari + aturan alert                                  |
| `loki`              | —                   | log semua container proyek `sgn`, 14 hari                       |
| `alloy`             | —                   | mengirim log container ke Loki (membaca docker socket)         |
| `postgres-exporter` | —                   | metrik Postgres                                                |
| `node-exporter`     | —                   | disk, memori, CPU mesin Docker                                 |

- **Metrik service.** IAM, HR, LMS, Directory, dan worker HR/LMS melayani
  `/metrics` di port internal `:9091` (`METRICS_ADDR`), tidak dibuka ke host
  dan tidak diteruskan nginx Portal. Isinya: request per rute (pattern
  ServeMux, mis. `GET /api/lms/v1/courses/{course_id}`) dan kode status,
  latensi, pool koneksi DB, hasil tiap job worker (`worker_job_*{task}`), dan
  antrean penugasan LMS. Tanpa `METRICS_ADDR` (mis. `go run` lokal) listener
  ini mati.
- **Dashboard** (folder SGN): *Layanan*, *Worker & Sync*, *Postgres & Host*,
  *Log*. File JSON di `docker/monitoring/grafana/dashboards/` dimuat saat
  start; perubahan lewat UI tidak disimpan, ubah file-nya.
- **Alert** ada di `docker/monitoring/prometheus/alerts.yml` (service mati,
  error 5xx > 5%, p95 > 1 dtk, lonjakan login gagal, pool DB penuh, job worker
  gagal, sync IAM > 3 jam, antrean penugasan macet, Postgres, disk < 15%).
  Status terlihat di Grafana (*Alerting* dan panel *Alert aktif*) dan
  Prometheus; **belum ada kanal kirim** (email/Telegram), tambahkan contact
  point Grafana atau Alertmanager di server produksi. Ubah aturan lalu
  `docker compose restart prometheus`.
- **Keamanan.** `alloy` memasang `/var/run/docker.sock` read-only, tapi socket
  itu tetap memberi kendali penuh atas Docker; di produksi pertimbangkan
  logging driver/journald. `postgres-exporter` memakai user Postgres utama
  untuk dev; di produksi buat role khusus dengan `pg_monitor`. Kalau
  `GRAFANA_ADMIN_PASSWORD` kosong, Grafana memakai `admin`/`admin` dan meminta
  ganti saat login pertama.
- Di Docker Desktop, `node-exporter` membaca VM Docker (tempat volume
  tersimpan), bukan disk Mac.
