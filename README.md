# sgn-deploy

Cara menjalankan seluruh sistem SGN di satu mesin: `compose.yaml`, konfigurasi `docker/` (Postgres, monitoring, secret),
dan skrip data demo `seed/`. Repo ini tidak berisi kode aplikasi; tiap aplikasi punya repo sendiri.

## Isi

| Jalur | Fungsi |
| --- | --- |
| `compose.yaml`, `.env.example` | Semua layanan, port, dan variabel lingkungan |
| `docker/` | README tumpukan Docker, `REBUILD.md`, init Postgres, monitoring (Prometheus, Loki, Grafana), folder `secrets/` |
| `seed/` | Skrip memuat data demo ke Directory, IAM, dan LMS (lihat `seed/README.md`) |

## Struktur folder

Compose membangun image dari folder repo yang berada **di dalam** folder ini. Clone setiap repo ke folder dengan nama
persis seperti kolom kanan (nama itu yang dirujuk compose, `go.mod`, dan `package.json`):

| Repo (nama yang disarankan) | Folder |
| --- | --- |
| `sgn-iam-be` | `sgn-iam-service` |
| `sgn-iam-contracts` | `sgn-iam-contracts` |
| `sgn-hr-be` | `sgn-hr-service` |
| `sgn-hr-contracts` | `sgn-hr-contracts` |
| `sgn-lms-be` | `sgn-lms-service` |
| `sgn-lms-fe` | `sgn-lms-fe` |
| `sgn-lms-contracts` | `sgn-lms-contracts` |
| `sgn-directory-be` | `sgn-directory-service` |
| `sgn-directory-fe` | `sgn-directory-fe` |
| `sgn-directory-contracts` | `sgn-directory-contracts` |
| `sgn-portal-fe` | `sgn-portal` |

Folder `sgn-*` di-ignore oleh git repo ini, jadi tidak ikut ter-commit.

## Menjalankan

Butuh Docker (Compose v2). Dari folder ini:

```bash
cp .env.example .env                 # isi POSTGRES_PASSWORD, S3_ACCESS_KEY, S3_SECRET_KEY
docker compose build
docker run --rm sgn-iam-service genkey > docker/secrets/iam-signing-key.txt
docker compose up -d
docker compose ps                    # semua "healthy", migrate "exited (0)"
```

Langkah awal (akun admin, klien layanan, database LMS) ada di [docker/README.md](docker/README.md).

| Alamat | Aplikasi |
| --- | --- |
| <http://localhost:3000> | Portal (IAM admin, HR) |
| <http://localhost:3003/lms/> | SUGARLedge (LMS) |
| <http://localhost:3001> | Directory FE |

Portal dan LMS sama-sama masuk dengan NIK. `LMS_PUBLIC_URL` di `.env` harus sama dengan alamat yang dipakai membuka LMS,
karena URL media bertanda tangan membawanya.

## Data demo

`seed/run.sh` memuat data demo setelah tumpukan menyala. Data karyawan asli tidak ada di repo ini (lihat `.gitignore` dan
`seed/README.md`).

## Rahasia

`.env`, `docker/secrets/*`, kunci, dan data karyawan tidak pernah di-commit. Contoh nilai hanya di `.env.example`.
