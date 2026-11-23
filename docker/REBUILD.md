# Rebuild Docker

Jalankan dari root workspace (folder yang berisi `compose.yaml`):

```bash
cd sgn-deploy
```

## Satu service

Contoh Portal: bangun ulang image, lalu ganti container dengan image baru.

```bash
docker compose build portal
docker compose up -d portal
```

| Yang berubah      | Perintah                                                           |
| ----------------- | ------------------------------------------------------------------ |
| Portal (FE)       | `docker compose build portal && docker compose up -d portal`             |
| Directory FE      | `docker compose build directory-fe && docker compose up -d directory-fe` |
| IAM               | `docker compose build iam && docker compose up -d`                       |
| HR                | `docker compose build hr && docker compose up -d`                        |
| LMS (backend)     | `docker compose build lms && docker compose up -d`                       |
| LMS FE            | `docker compose build lms-fe && docker compose up -d lms-fe`             |
| Directory service | `docker compose build directory && docker compose up -d directory`       |
| Semua             | `docker compose build && docker compose up -d`                           |

## Catatan

- **IAM dan HR** memakai `up -d` untuk semua service, karena `iam-migrate`,
  `hr-migrate`, dan `hr-worker` memakai image yang sama. Dengan begitu mereka
  ikut diganti, dan migrasi baru (kalau ada) langsung dijalankan.
- **Data aman.** Rebuild tidak menyentuh database atau lampiran HR, karena
  keduanya ada di volume `pgdata` dan `hr-storage`. Data hanya hilang kalau
  menjalankan `docker compose down -v`.
- **Directory service tidak punya job migrate.** Migrasinya hanya jalan
  otomatis saat volume `pgdata` baru dibuat. Untuk volume yang sudah ada,
  jalankan file migrasi baru secara manual **sebelum** `up -d directory`,
  misalnya:

  ```bash
  docker compose exec postgres sh -c \
    'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d db_directory -f /migrations/directory/0020_users_nik.sql'
  ```

- **Directory FE** menanam URL directory service saat build. Kalau
  `DIRECTORY_PORT` di `.env` diubah, rebuild `directory-fe`.

## Cek hasil

```bash
docker compose ps                  # service "healthy", job migrate "Exited (0)"
docker compose logs -f portal      # ganti portal dengan nama service yang gagal
```
