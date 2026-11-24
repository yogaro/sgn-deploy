# Deploy ke VPS

Seluruh sistem (Portal, SUGARLedge/LMS, Directory, IAM, HR) berjalan di **satu VPS** dengan Docker Compose. Caddy di depan
mengurus HTTPS (sertifikat Let's Encrypt otomatis). Selain SSH, hanya port 80/443 yang terbuka.

```
Internet ──443──▶ caddy ─┬─ SGN_DOMAIN/            ▶ portal   (nginx: /api/iam → iam, /api/hr → hr)
                         ├─ SGN_DOMAIN/lms/        ▶ lms-fe   (nginx: /api/iam → iam, /api/lms → lms, /lms-files → s3)
                         ├─ DIRECTORY_DOMAIN/      ▶ directory-fe
                         └─ DIRECTORY_DOMAIN/api/  ▶ directory
          internal saja: postgres, s3 (RustFS), iam, hr, hr-worker, lms, lms-worker
```

File yang dipakai:

| File | Fungsi |
| --- | --- |
| `compose.yaml` + `compose.prod.yaml` | layanan, plus override server: Caddy, origin HTTPS, port aplikasi ditutup |
| `docker/caddy/Caddyfile` | rute domain |
| `docker/vps-setup.sh` | memasang Docker, Node 22, firewall, dan swap di Ubuntu baru |
| `docker/clone-repos.sh` | clone/pull 11 repo aplikasi ke nama folder yang benar |
| `docker/vps-bootstrap.sh` | membuat `.env` dengan rahasia acak, kunci IAM, build, klien layanan, lalu menyalakan semua |
| `docker/backup.sh` | backup database + object store |
| `seed/run.sh` | memuat data karyawan asli + modul piloting |

## 1. Siapkan VPS dan domain

**Penyedia bebas** (IDCloudHost, Biznet Gio, DigitalOcean, Vultr, AWS Lightsail, dan lain-lain), asal Ubuntu 22.04/24.04,
punya IP publik, dan akses root lewat SSH. Untuk karyawan di Indonesia, pilih data center Jakarta/Singapura.

| | Minimum (piloting) | Disarankan |
| --- | --- | --- |
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB (+ swap 4 GB, dipasang otomatis) | 8 GB |
| Disk | 60 GB SSD | 100 GB SSD atau lebih (video kursus bisa sampai 600 MB per berkas) |

**DNS:** buat dua record A ke IP VPS, misalnya:

| Nama | Isi |
| --- | --- |
| `sgn.contoh.co.id` (`SGN_DOMAIN`) | Portal di `/`, SUGARLedge di `/lms/` |
| `directory.contoh.co.id` (`DIRECTORY_DOMAIN`) | Directory |

**Belum punya domain?** Pakai sslip.io, yang memetakan nama ke IP tanpa perlu mendaftar. Untuk IP `103.10.20.30`:
`SGN_DOMAIN=103-10-20-30.sslip.io` dan `DIRECTORY_DOMAIN=directory.103-10-20-30.sslip.io`. HTTPS tetap jalan, tetapi
ini hanya cocok untuk uji coba. Untuk piloting ke karyawan, pakai domain perusahaan.

## 2. Pasang Docker dan alat dasar

```bash
ssh root@IP_VPS
git clone git@github.com:yogaro/sgn-deploy.git /opt/sgn      # atau https://github.com/yogaro/sgn-deploy.git
cd /opt/sgn
bash docker/vps-setup.sh
```

Repo bersifat privat, jadi VPS perlu akses baca. Cara paling mudah: buat kunci SSH di VPS (`ssh-keygen -t ed25519`) lalu
tambahkan `~/.ssh/id_ed25519.pub` ke akun GitHub yang punya akses ke repo `yogaro/*`.

## 3. Ambil kode semua aplikasi

```bash
docker/clone-repos.sh                    # 11 repo masuk ke sgn-iam-service, sgn-lms-fe, dst.
```

## 4. Nyalakan semua layanan

```bash
SGN_DOMAIN=sgn.contoh.co.id DIRECTORY_DOMAIN=directory.contoh.co.id docker/vps-bootstrap.sh
```

Skrip ini:

- membuat `.env` (izin 600) dengan sandi Postgres, kunci S3, dan sandi Grafana acak;
- mengisi `COMPOSE_FILE=compose.yaml:compose.prod.yaml`, sehingga setiap `docker compose …` berikutnya otomatis memakai
  setelan server;
- membuat kunci tanda tangan IAM;
- membuat tiga klien layanan dan menyimpannya di `.env`: kunci IAM → Directory, klien HR → IAM, dan klien LMS → IAM;
- menyalakan semua layanan dan menunggu semuanya sehat.

Build pertama makan waktu sekitar 10–20 menit. Skrip aman diulang, dan rahasia yang sudah ada tidak diganti.

Sertifikat HTTPS diambil Caddy saat domain pertama kali dibuka. Kalau gagal, cek `docker compose logs caddy`: biasanya
DNS belum mengarah ke VPS, atau port 80/443 diblokir firewall penyedia (security group).

## 5. Akun awal

```bash
docker compose run --rm iam createadmin          # superadmin IAM: buka Portal dan LMS (isi Login ID + sandi kuat)
docker compose run --rm directory createuser     # akun login Directory
```

## 6. Muat data karyawan dan piloting

Data karyawan asli dan media **tidak ada di repo**. Salin dari laptop yang memilikinya:

```bash
# dijalankan di laptop, dari folder portal-sgn
rsync -az --info=progress2 seed/data/private/ root@IP_VPS:/opt/sgn/seed/data/private/
rsync -az --info=progress2 seed/assets/       root@IP_VPS:/opt/sgn/seed/assets/            # sekitar 275 MB
scp "Trailer Sugartime.mp4" root@IP_VPS:/opt/sgn/                                         # video banner login
```

Lalu di VPS:

```bash
cd /opt/sgn
SEED_PASSWORD='SandiAwal-Piloting-2026!' SEED_MUST_CHANGE=1 seed/run.sh --formasi
```

Hasilnya:

| Akun | Masuk dengan | Sandi |
| --- | --- | --- |
| Admin L&D (`ADMIN-LMS`) | `ADMIN-LMS` | `SEED_PASSWORD`, tidak wajib diganti (seed memakai akun ini) |
| Setiap karyawan aktif di FORMASI | NIK | `SEED_PASSWORD`, **wajib diganti saat pertama masuk** |
| Peserta demo `DEMO-SPI-01` … `DEMO-LITBANG-01` | ID itu | sama, wajib diganti |

Modul piloting PSDM (`seed/data/piloting.mjs`) terbit sebagai kursus dan ditugaskan ke unit piloting. Daftar peran
(trainer, pelapor, penyetuju keuangan) dicetak saat seed berjalan.

**Jangan pakai sandi demo `Demo#Sgn2026` di server.** Sandi itu tertulis di repo. Skrip menolak `SEED_MUST_CHANGE` tanpa
`SEED_PASSWORD`. Selama piloting, orang yang tahu NIK rekannya dan sandi awal bisa masuk lebih dulu. Karena itu, bagikan
sandi awal hanya ke peserta piloting, dan minta mereka segera masuk. Admin L&D bisa mereset sandi siapa pun di
**LMS → Pengaturan → Akun karyawan**.

Seed aman diulang, tetapi `--formasi` membangun ulang data LMS (kursus, peserta, progres). **Jangan jalankan ulang
setelah piloting dimulai**, kecuali memang ingin mengulang dari nol.

## 7. Backup

```bash
docker/backup.sh                                   # uji sekali
crontab -e                                         # lalu tambahkan:
0 2 * * * cd /opt/sgn && docker/backup.sh >> backups/backup.log 2>&1
```

Backup berisi dump empat database, isi object store (video, PDF, lampiran HR), `.env`, dan kunci IAM, disimpan di
`backups/` (14 hari). **Salin juga ke luar VPS** (laptop, object storage penyedia, atau snapshot VPS), karena backup yang
hanya ada di VPS ikut hilang bila VPS-nya rusak.

Pemulihan database: `docker compose exec -T postgres pg_restore -U sgn -d db_lms --clean < backups/…/db_lms.dump`.

## 8. Pembaruan kode

```bash
cd /opt/sgn
git pull && docker/clone-repos.sh
docker compose up -d --build          # migrasi jalan otomatis (iam-migrate, hr-migrate, lms-migrate)
docker image prune -f
```

Tab browser yang masih terbuka memuat ulang sendiri saat chunk lama hilang (`chunkReload.js`).

## Pemantauan (opsional)

```bash
docker compose --profile monitoring up -d
ssh -L 3002:127.0.0.1:3002 root@IP_VPS     # dari laptop, lalu buka http://localhost:3002
```

Login Grafana: `admin`, sandi `GRAFANA_ADMIN_PASSWORD` di `.env`. Grafana dan Prometheus hanya terbuka di localhost VPS.

## Perintah sehari-hari

| Perlu | Perintah |
| --- | --- |
| Status | `docker compose ps` |
| Log satu layanan | `docker compose logs -f --tail=100 lms` |
| Restart | `docker compose restart lms` |
| Masuk database | `docker compose exec postgres psql -U sgn -d db_lms` |
| Sinkron ulang IAM dari Directory | `docker compose run --rm iam sync --full` |

## Catatan keamanan

- `.env`, `docker/secrets/`, dan `backups/` berisi rahasia. Jangan di-commit dan jangan dibagikan lewat chat.
- `ufw` hanya membuka SSH, 80, dan 443. Postgres dan port aplikasi tidak dipublikasikan. `lms-fe` hanya terbuka di
  `127.0.0.1:3003` untuk skrip seed.
- Aktifkan login SSH dengan kunci saja (`PasswordAuthentication no` di `/etc/ssh/sshd_config`) setelah kunci Anda terpasang.
- Image `rustfs/rustfs:latest` belum dikunci versinya. Setelah stabil, ganti dengan tag versi tertentu di `compose.yaml`.
