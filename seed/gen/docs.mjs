// Writes docs/seed/AKUN.md (accounts and roles) from the seed data. Run: node seed/gen/docs.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const root = new URL('../../', import.meta.url).pathname
const people = JSON.parse(readFileSync(`${root}seed/data/people.json`, 'utf8'))
const by = new Map(people.map((p) => [p.employee_number, p]))
const row = (n, role, note) => { const p = by.get(n); return `| ${p.name} | ${p.email} | ${p.position.replace('PTSGN-POS-', '')} | ${role} | ${note} |` }
const personas = [
  ['PTSGN-1034', 'LMS_ADMIN, LMS_REPORTER', 'Kepala Sub Divisi Pengembangan SDM dan Budaya: menerbitkan kursus, penugasan, surat evaluasi; penanda tangan sertifikat'],
  ['PTSGN-1035', 'LMS_ADMIN', 'Staf L&D: mencatat kehadiran sesi, verifikasi sertifikat, Knowledge Hub'],
  ['PTSGN-1036', 'LMS_ADMIN', 'Staf L&D: data dan analitik'],
  ['PTSGN-1008', 'LMS_FINANCE_APPROVER', 'Kepala Divisi Keuangan: langkah akhir persetujuan usulan pelatihan'],
  ['PTSGN-1010', 'LMS_FINANCE_APPROVER', 'Staf Anggaran'],
  ['PTSGN-1007', 'LMS_REPORTER', 'Direktur Keuangan dan SDM: laporan dan rencana'],
  ['PTSGN-1011', 'LMS_REPORTER', 'Kepala Divisi SDM: langkah SDM pada usulan; penanda tangan surat evaluasi'],
  ['PTSGN-1001', 'LMS_REPORTER', 'Direktur Utama: laporan'],
  ['PTSGN-1037', 'TRAINER', 'Kepala Divisi Teknik dan Pengolahan: penulis kursus pengolahan'],
  ['PTSGN-1038', 'TRAINER', 'Pembina Quality Assurance'],
  ['PTSGN-1039', 'TRAINER', 'Pembina Teknik dan Pemeliharaan'],
  ['PTSGN-1043', 'TRAINER', 'Staf K3L: penulis kursus K3 dan lingkungan'],
  ['PTSGN-1028', 'TRAINER', 'Auditor Internal: kursus audit dan sistem manajemen'],
  ['PTSGN-1025', 'TRAINER', 'Staf Pengadaan: kursus pengadaan'],
  ['PTSGN-1041', 'TRAINER', 'Staf Tanaman: kursus budidaya'],
]
const md = `# Akun demo SUGARLedge

Semua akun demo memakai **satu kata sandi bersama**: \`Demo#Sgn2026\` (khusus lingkungan lokal; status ACTIVE, tanpa wajib ganti sandi).
Semua nama, email, NIK, dan nomor karyawan di sini **fiktif**. Domain email: \`@sgn.example\`.
Muat ulang data dengan \`seed/run.sh\`; hapus data LMS dengan \`seed/reset.sh\`.

## Rantai data (siapa terhubung ke apa)
\`\`\`
Directory (unit, jabatan, karyawan)  ->  IAM (sinkron: akun PENDING, peran EMPLOYEE + LEARNER)
  ->  IAM peran LMS + kata sandi (seed/sql/20_iam_roles.sql)  ->  LMS (sinkron core.*)  ->  data LMS (seed/sql/30_lms.sql)
\`\`\`
LMS hanya membaca IAM; tidak pernah menulis ke IAM atau Directory.

## Persona dengan peran khusus
| Nama | Email | Jabatan | Peran LMS | Fungsi dalam alur |
|---|---|---|---|---|
${personas.map(([n, r, note]) => row(n, r, note)).join('\n')}

Peran dasar semua akun: **LEARNER** (belajar, usulan, evaluasi). Atasan langsung (kepala unit) otomatis mendapat Tim Saya, persetujuan usulan tahap atasan, dan penilaian perilaku.

## Akun biasa yang baik untuk dicoba
| Nama | Email | Jabatan | Yang menarik |
|---|---|---|---|
${['PTSGN-1014', 'PTSGN-1019'].map((n) => { const p = by.get(n); return `| ${p.name} | ${p.email} | ${p.position.replace('PTSGN-POS-', '')} | Atasan: Tim Saya dan persetujuan usulan |` }).join('\n')}

## Seluruh akun (${people.length})
| Nomor | Nama | Email | Jabatan |
|---|---|---|---|
${people.map((p) => `| ${p.employee_number} | ${p.name} | ${p.email} | ${p.position.replace('PTSGN-POS-', '')} |`).join('\n')}

## Akun sistem lama (tidak diubah)
\`dev-admin@sgn.example\` (SUPERADMIN), \`admin@sgn.com\`, \`admindirectory@sgn.com\`, \`yoga@sgn.com\`: kata sandi mengikuti pengaturan sebelumnya, bukan sandi demo.
`
writeFileSync(`${root}docs/seed/AKUN.md`, md)
console.log('AKUN.md written')
