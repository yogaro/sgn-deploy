// The organisation the demo runs on: the existing PTSGN-* head-office tree grown with new divisions, three regions, and eight sugar mills (PG).
// Names of people are made up; unit names, mills, and positions follow the real structure (a PG is led by a General Manager with
// managers for Tanaman, Pengolahan, Quality Assurance, Teknik, and Administrasi Keuangan Umum).

// level is the depth in the tree; position levels follow the depth of the unit.
export const heads = {
  dirut: 'PTSGN-POS-DIRUT',
  dirKeuSdm: 'PTSGN-POS-DIRKEUSDM',
  dirTekOps: 'PTSGN-POS-DIRTEKOPS',
}

// New head-office units under existing parents. `staff` are positions without a head flag.
export const hoUnits = [
  {
    code: 'PTSGN-DIV-PENGADAAN', name: 'Divisi Pengadaan', parent: 'PTSGN-DIR-UTAMA', fn: 'Administrasi Umum',
    head: { code: 'PTSGN-POS-KADIV-PENGADAAN', name: 'Kepala Divisi Pengadaan', parent: heads.dirut, edu: ['S1', 'Teknik Industri'] },
    staff: [
      { code: 'PTSGN-POS-STAF-PENGADAAN-01', name: 'Staf Perencanaan Pengadaan', edu: ['S1', 'Manajemen'] },
      { code: 'PTSGN-POS-STAF-PENGADAAN-02', name: 'Staf Evaluasi Harga Perkiraan Sendiri', edu: ['S1', 'Teknik Sipil'] },
    ],
  },
  {
    code: 'PTSGN-DIV-SPI', name: 'Divisi Satuan Pengawasan Intern', parent: 'PTSGN-DIR-UTAMA', fn: 'Keuangan & Akuntansi',
    head: { code: 'PTSGN-POS-KADIV-SPI', name: 'Kepala Divisi Satuan Pengawasan Intern', parent: heads.dirut, edu: ['S1', 'Akuntansi'] },
    staff: [
      { code: 'PTSGN-POS-STAF-SPI-01', name: 'Auditor Internal Operasional', edu: ['S1', 'Akuntansi'] },
      { code: 'PTSGN-POS-STAF-SPI-02', name: 'Auditor Internal Keuangan', edu: ['S1', 'Akuntansi'] },
    ],
  },
  {
    code: 'PTSGN-DIV-HUKUM', name: 'Divisi Hukum dan Manajemen Aset', parent: 'PTSGN-DIR-UTAMA', fn: 'Sekretariat & Hukum',
    head: { code: 'PTSGN-POS-KADIV-HUKUM', name: 'Kepala Divisi Hukum dan Manajemen Aset', parent: heads.dirut, edu: ['S2', 'Ilmu Hukum'] },
    staff: [{ code: 'PTSGN-POS-STAF-HUKUM-01', name: 'Staf Manajemen Aset Tanah dan Bangunan', edu: ['S1', 'Ilmu Hukum'] }],
  },
  {
    code: 'PTSGN-DIV-RISIKO', name: 'Divisi Manajemen Risiko dan Kepatuhan', parent: 'PTSGN-DIR-KEUSDM', fn: 'Keuangan & Akuntansi',
    head: { code: 'PTSGN-POS-KADIV-RISIKO', name: 'Kepala Divisi Manajemen Risiko dan Kepatuhan', parent: heads.dirKeuSdm, edu: ['S2', 'Manajemen Risiko'] },
    staff: [{ code: 'PTSGN-POS-STAF-RISIKO-01', name: 'Staf Kepatuhan dan Pengendalian Internal', edu: ['S1', 'Akuntansi'] }],
  },
  {
    code: 'PTSGN-SUBDIV-PSDMB', name: 'Sub Divisi Pengembangan SDM dan Budaya', parent: 'PTSGN-DIV-SDM', fn: 'Sumber Daya Manusia',
    head: { code: 'PTSGN-POS-KASUBDIV-PSDMB', name: 'Kepala Sub Divisi Pengembangan SDM dan Budaya', parent: 'PTSGN-POS-KADIV-SDM', edu: ['S2', 'Psikologi Industri dan Organisasi'] },
    staff: [
      { code: 'PTSGN-POS-STAF-PSDMB-01', name: 'Staf Learning and Development', edu: ['S1', 'Psikologi'] },
      { code: 'PTSGN-POS-STAF-PSDMB-02', name: 'Staf Budaya dan Kompetensi', edu: ['S1', 'Manajemen Sumber Daya Manusia'] },
    ],
  },
  {
    code: 'PTSGN-DIV-TEKPOL', name: 'Divisi Teknik dan Pengolahan', parent: 'PTSGN-DIR-TEKOPS', fn: 'Produksi',
    head: { code: 'PTSGN-POS-KADIV-TEKPOL', name: 'Kepala Divisi Teknik dan Pengolahan', parent: heads.dirTekOps, edu: ['S1', 'Teknik Kimia'] },
    staff: [
      { code: 'PTSGN-POS-STAF-TEKPOL-01', name: 'Pembina Pengolahan Pabrik Gula', edu: ['S1', 'Teknik Kimia'] },
      { code: 'PTSGN-POS-STAF-TEKPOL-02', name: 'Pembina Teknik dan Pemeliharaan', edu: ['S1', 'Teknik Mesin'] },
    ],
  },
  {
    code: 'PTSGN-DIV-TANAMAN', name: 'Divisi Tanaman dan Pengembangan Bahan Baku', parent: 'PTSGN-DIR-TEKOPS', fn: 'Produksi',
    head: { code: 'PTSGN-POS-KADIV-TANAMAN', name: 'Kepala Divisi Tanaman dan Pengembangan Bahan Baku', parent: heads.dirTekOps, edu: ['S1', 'Agronomi'] },
    staff: [{ code: 'PTSGN-POS-STAF-TANAMAN-01', name: 'Pembina Budidaya Tebu', edu: ['S1', 'Budidaya Tanaman Perkebunan'] }],
  },
  {
    code: 'PTSGN-DIV-K3L', name: 'Divisi K3 dan Lingkungan', parent: 'PTSGN-DIR-TEKOPS', fn: 'Pengendalian Mutu',
    head: { code: 'PTSGN-POS-KADIV-K3L', name: 'Kepala Divisi K3 dan Lingkungan', parent: heads.dirTekOps, edu: ['S1', 'Keselamatan dan Kesehatan Kerja'] },
    staff: [
      { code: 'PTSGN-POS-STAF-K3L-01', name: 'Ahli K3 Umum', edu: ['S1', 'Keselamatan dan Kesehatan Kerja'] },
      { code: 'PTSGN-POS-STAF-K3L-02', name: 'Staf Pengelolaan Lingkungan', edu: ['S1', 'Teknik Lingkungan'] },
    ],
  },
]

// Units added after the demo was first generated (November 2026, for the PSDM pilot). They are generated last and without
// drawing random numbers for their positions, so every person made before them keeps the same name and number; their
// people are flagged `late` and the LMS demo history (seed/gen/lms.mjs) leaves them out.
export const lateUnits = [
  {
    code: 'PTSGN-DIV-LITBANG', name: 'Divisi Penelitian dan Pengembangan', parent: 'PTSGN-DIR-TEKOPS', fn: 'Produksi', prov: '35',
    head: { code: 'PTSGN-POS-KADIV-LITBANG', name: 'Kepala Divisi Penelitian dan Pengembangan', parent: heads.dirTekOps, edu: ['S2', 'Agronomi'] },
    staff: [{ code: 'PTSGN-POS-STAF-LITBANG-01', name: 'Staf Kultur Jaringan', edu: ['S1', 'Bioteknologi'] }],
  },
]

// The eight clusters of SGN with their mills (PG) and plantations (kebun), as given by the PO. `detailed` mills are the ones that
// appear in the 2026 training letters; they get the full set of bagian. Every PG has a General Manager and every kebun a manager.
// prov is the two-digit province code used for made-up NIKs.
export const clusters = [
  {
    code: 'SUM1', name: 'Cluster Sumatera I', head: 'Kepala Cluster Sumatera I', sumatra: true,
    pgs: [{ k: 'KWMD', name: 'PG Kwala Madu', prov: '12' }, { k: 'SESM', name: 'PG Sei Semayang', prov: '12' }],
    kebun: ['Kebun Kwala Madu', 'Kebun Sei Semayang'],
  },
  {
    code: 'SUM2', name: 'Cluster Sumatera II', head: 'Kepala Cluster Sumatera II', sumatra: true,
    pgs: [{ k: 'BUMA', name: 'PG Bungamayang', prov: '18', detailed: true }, { k: 'CIMA', name: 'PG Cinta Manis', prov: '16', detailed: true }],
    kebun: ['Kebun Bungamayang', 'Kebun Cinta Manis I', 'Kebun Cinta Manis II'],
  },
  {
    code: 'JWB', name: 'Cluster Jawa Wilayah Barat', head: 'Kepala Cluster Jawa Wilayah Barat',
    pgs: [
      { k: 'PANG', name: 'PG Pangkah', prov: '33' }, { k: 'SRAG', name: 'PG Sragi', prov: '33', detailed: true },
      { k: 'REND', name: 'PG Rendeng', prov: '33', detailed: true }, { k: 'MOJO', name: 'PG Mojo', prov: '33', detailed: true },
      { k: 'TASM', name: 'PG Tasikmadu', prov: '33' }, { k: 'SOED', name: 'PG Soedhono', prov: '35' },
      { k: 'POER', name: 'PG Poerwodadie', prov: '35' }, { k: 'REDJ', name: 'PG Redjosarie', prov: '35' }, { k: 'PAGO', name: 'PG Pagottan', prov: '35' },
    ],
    kebun: ['Kebun Jawa Tengah'],
  },
  {
    code: 'JT1', name: 'Cluster Jawa Timur I', head: 'Kepala Cluster Jawa Timur I',
    pgs: [
      { k: 'TJOE', name: 'PG Tjoekir', prov: '35' }, { k: 'MERI', name: 'PG Meritjan', prov: '35' },
      { k: 'PEBA', name: 'PG Pesantren Baru', prov: '35', detailed: true }, { k: 'NGAD', name: 'PG Ngadiredjo', prov: '35' },
      { k: 'MODJ', name: 'PG Modjopanggoong', prov: '35' },
    ],
    kebun: ['Kebun Dhoho'],
  },
  {
    code: 'JT2', name: 'Cluster Jawa Timur II', head: 'Kepala Cluster Jawa Timur II',
    pgs: [
      { k: 'KREM', name: 'PG Kremboong', prov: '35' }, { k: 'GEMP', name: 'PG Gempolkrep', prov: '35' },
      { k: 'DJOM', name: 'PG Djombang Baru', prov: '35' }, { k: 'LEST', name: 'PG Lestari', prov: '35' },
    ],
    kebun: ['Kebun Agroforestry'],
  },
  {
    code: 'JT3', name: 'Cluster Jawa Timur III', head: 'Kepala Cluster Jawa Timur III',
    pgs: [
      { k: 'KEDA', name: 'PG Kedawoeng', prov: '35' }, { k: 'WONO', name: 'PG Wonolangan', prov: '35' }, { k: 'GEND', name: 'PG Gending', prov: '35' },
      { k: 'DJAT', name: 'PG Djatiroto', prov: '35', detailed: true }, { k: 'SEMB', name: 'PG Semboro', prov: '35' },
    ],
    kebun: ['Kebun Lumajang Raya'],
  },
  {
    code: 'JT4', name: 'Cluster Jawa Timur IV', head: 'Kepala Cluster Jawa Timur IV',
    pgs: [
      { k: 'WRIN', name: 'PG Wringinanom', prov: '35' }, { k: 'OLEA', name: 'PG Olean', prov: '35' }, { k: 'PAND', name: 'PG Pandjie', prov: '35' },
      { k: 'ASEM', name: 'PG Asembagoes', prov: '35' }, { k: 'PRAD', name: 'PG Pradjekan', prov: '35' }, { k: 'GLEN', name: 'PG Glenmore', prov: '35', detailed: true },
    ],
    kebun: ['Kebun Mumbul', 'Kebun Banyuwangi Raya', 'Kebun Kalitelepak'],
  },
  {
    code: 'SUL', name: 'Cluster Sulawesi', head: 'Kepala Cluster Sulawesi', sulawesi: true,
    pgs: [{ k: 'BONE', name: 'PG Bone', prov: '73' }, { k: 'CAMM', name: 'PG Camming', prov: '73' }, { k: 'TAKA', name: 'PG Takalar', prov: '73' }],
    kebun: ['Kebun Bone', 'Kebun Camming', 'Kebun Takalar'],
  },
]

// The five bagian of a mill: manager title, bagian name, directory function, degree.
export const bagian = [
  { key: 'TAN', unit: 'Bagian Tanaman', mgr: 'Manajer Tanaman', fn: 'Produksi', edu: ['S1', 'Agronomi'], asst: 'Asisten Manajer Tanaman' },
  { key: 'OLH', unit: 'Bagian Pengolahan', mgr: 'Manajer Pengolahan', fn: 'Produksi', edu: ['S1', 'Teknik Kimia'], asst: 'Asisten Manajer Pengolahan' },
  { key: 'QA', unit: 'Bagian Quality Assurance', mgr: 'Manajer Quality Assurance', fn: 'Pengendalian Mutu', edu: ['S1', 'Teknologi Industri Pertanian'], asst: 'Analis Laboratorium Mutu' },
  { key: 'TEK', unit: 'Bagian Teknik', mgr: 'Manajer Teknik', fn: 'Produksi', edu: ['S1', 'Teknik Mesin'], asst: 'Asisten Manajer Teknik' },
  { key: 'AKU', unit: 'Bagian Administrasi Keuangan dan Umum', mgr: 'Manajer Administrasi Keuangan dan Umum', fn: 'Administrasi Umum', edu: ['S1', 'Akuntansi'], asst: 'Staf Administrasi dan Umum' },
]
// Detailed mills that also get an assistant in Pengolahan and Quality Assurance.
export const bigMills = new Set(['GLEN', 'DJAT', 'SRAG', 'PEBA'])

const javanese = ['Agus', 'Bagas', 'Bayu', 'Danu', 'Dimas', 'Eko', 'Fandi', 'Galih', 'Hadi', 'Ilham', 'Joko', 'Krisna', 'Lukman', 'Mahendra', 'Nanda', 'Oki', 'Prasetya', 'Rangga', 'Satrio', 'Teguh', 'Untung', 'Vicky', 'Wahyu', 'Yudha', 'Zainal', 'Arief', 'Bintang', 'Cahyo', 'Denny', 'Edo', 'Fikri', 'Gilang', 'Heru', 'Indra', 'Kurnia', 'Reza', 'Surya', 'Tri', 'Yoga', 'Anton']
const javaneseF = ['Ayu', 'Bella', 'Citra', 'Dian', 'Endah', 'Fitri', 'Gita', 'Hesti', 'Intan', 'Juwita', 'Kartika', 'Laras', 'Mega', 'Novita', 'Octavia', 'Puspita', 'Rani', 'Sekar', 'Tika', 'Utami', 'Vina', 'Wulan', 'Yanti', 'Zahra', 'Amalia', 'Dewi', 'Elsa', 'Farah', 'Indah', 'Larasati', 'Maharani', 'Nurul', 'Retno', 'Sari', 'Tiara', 'Ratih']
const sumatraM = ['Ahmad', 'Bahrul', 'Chandra', 'Dedy', 'Erwin', 'Fauzan', 'Hasbi', 'Irfan', 'Jefri', 'Khairul', 'Munawar', 'Syafrizal']
const sumatraF = ['Aisyah', 'Dewi', 'Fitria', 'Hafizah', 'Mawar', 'Nadia', 'Rahmah', 'Syarifah']
const surnames = ['Pratama', 'Wijaya', 'Kusuma', 'Santoso', 'Hidayat', 'Nugroho', 'Saputra', 'Setiawan', 'Purnomo', 'Wibowo', 'Utomo', 'Susilo', 'Hartono', 'Gunawan', 'Firmansyah', 'Maulana', 'Ramadhan', 'Permana', 'Anggara', 'Kurniawan', 'Prakoso', 'Wicaksono', 'Budiman', 'Lestari', 'Handayani', 'Sulistyo', 'Rahardjo', 'Mulyadi', 'Syahputra', 'Siregar', 'Harahap', 'Lubis', 'Nasution', 'Hasibuan', 'Saragih', 'Pohan', 'Effendi', 'Cahyono', 'Suryanto', 'Yuliana', 'Aprilia', 'Puspitasari', 'Rahmawati', 'Andriani', 'Safitri', 'Oktaviana', 'Febrianti', 'Marlina', 'Wulandari', 'Kartini']

const sulawesiM = ['Andi', 'Baso', 'Muh. Arfan', 'Rahmat', 'Syahrul', 'Fadly', 'Ilham', 'Yusuf']
const sulawesiF = ['Andi Nurul', 'Hasniah', 'Sitti', 'Fatmawati', 'Rosmiati', 'Nurhaliza']
export const names = { javanese, javaneseF, sumatraM, sumatraF, sulawesiM, sulawesiF, surnames }

// Names already taken by the earlier sample people, so a new person never repeats one.
export const taken = [
  'Yuni Astuti', 'Budi Santoso', 'Putri Anggraini', 'Sri Wahyuni', 'Irwan Saputra', 'Agus Wibowo', 'Siti Rahayu', 'Nur Hidayah',
  'Hendra Gunawan', 'Bambang Kurniawan', 'Maya Oktaviani', 'Lina Marlina', 'Arif Rahman', 'Fajar Ramadhan', 'Dewi Lestari',
  'Ratna Wulandari', 'Rizal Firmansyah', 'Novan Yoga Rochsianto', 'Rizky Pratama', 'Indah Permatasari', 'Taufik Hidayat',
  'Dedi Setiawan', 'Joko Susanto', 'Ayu Kartika', 'Eko Prasetyo',
]
