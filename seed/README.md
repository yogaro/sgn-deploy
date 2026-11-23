# seed

Skrip memuat data demo ke tumpukan Docker lokal, mengikuti arah datanya: Directory → sinkron IAM → peran dan sandi IAM →
sinkron LMS → data demo LMS. Aman diulang; setiap langkah memakai kode unik atau membangun ulang tabelnya sendiri.

## Prasyarat

- Tumpukan menyala (`docker compose up -d`), Node 20+, `curl`, `python3`.
- Akun admin LMS bukan karyawan (`ADMIN-LMS`) sudah ada; skrip masuk sebagai akun ini.

## Perintah

```bash
seed/run.sh              # organisasi dan riwayat demo fiktif
seed/run.sh --formasi    # organisasi dari daftar karyawan asli, LMS bersih tanpa riwayat karangan
seed/run.sh --assets     # buat ulang dan unggah media (cover, video) lebih dulu
seed/reset.sh            # kosongkan data demo LMS (kursus, peserta, evaluasi, LNA, Knowledge Hub); akun tetap
```

`--formasi` membutuhkan `seed/data/private/formasi.json`, `people.json`, dan `positions.json` (data karyawan asli; tidak ada
di repo, minta dari PO). Media hasil `seed/gen/assets.mjs` (sekitar 275 MB) juga tidak ikut repo.

## Isi

| Jalur | Fungsi |
| --- | --- |
| `gen/` | Pembangkit SQL dan pemuat data (`directory*.mjs`, `iam*.mjs`, `lms.mjs`, `upload.mjs`, `banners.mjs`, `check.mjs`) |
| `data/*.mjs`, `data/people.json` | Katalog kursus, Knowledge Hub, sesi tatap muka, struktur organisasi, dan staf **fiktif** |
| `sql/00_*`, `01_*`, `02_*` | Skrip reset dan perbaikan |
| `sql/10_*`, `20_*`, `30_*` | Keluaran pembangkit; di-ignore karena memuat data karyawan |

## Akun demo

Masuk di <http://localhost:3003/lms/masuk> dengan **NIK** (bukan email). Kata sandi semua akun demo: `Demo#Sgn2026`
(khusus lingkungan lokal).

| ID masuk | Peran |
| --- | --- |
| `ADMIN-LMS` | Admin L&D (bukan karyawan): kelola LMS dan akun karyawan |
| `DEV-ADMIN` | Superadmin IAM (bukan karyawan) |
| `DEMO-SPI-01`, `DEMO-TEKPOL-01`, `DEMO-SEKPER-01`, `DEMO-K3-01`, `DEMO-TANAMAN-01`, `DEMO-SDM-01`, `DEMO-LITBANG-01` | Peserta fiktif, satu per unit piloting |

Dengan `--formasi`, setiap karyawan aktif di daftar FORMASI otomatis punya akun dengan NIK-nya sebagai ID masuk dan peran
dasar LEARNER; kepala unit menjadi atasan untuk Tim Saya dan persetujuan usulan. Pemegang peran khusus (trainer,
pelapor, penyetuju keuangan) dicocokkan dari jabatan di `gen/iam-formasi.mjs`.
