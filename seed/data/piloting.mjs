// Learning modules for the PSDM pilot, from the "Piloting" sheet the PSDM team shared (Piloting.xlsx, November 2026).
// One block per pilot unit. role: 'lp' is the sheet's "Learning Path" module, 'open' the open modules, 'assigned' the ones
// assigned to the pilot. `file`/`slides`/`folder` is the Google Drive id; seed/gen/piloting-fetch.mjs turns it into
// seed/assets/piloting/<code>.pdf; `pages` is that PDF's page count. `sheet` keeps the title as written in the sheet, `title` is the tidied one shown in the LMS.
// `fromFolder` marks a module the sheet linked as a Drive folder (holding one PDF); `sameAs` a row whose link is the same file as
// another module's, which becomes no course of its own.
// The material is real (from PSDM). `pilot` is the made-up demo position that takes the pilot; with the real staff list
// (lms.mjs --formasi) `formasi` names the units instead, and `titles` narrows a unit to those job titles. The K3 block has
// no unit in the sheet: it goes to the K3 posts in Divisi Teknik & Pengolahan. The sheet's SDM notes name career and talent
// heads in both SDM divisions, so those two divisions take the SDM block whole.
export const pilotUnits = [
  {
    sheet: 'SPI', unit: 'PTSGN-DIV-SPI', category: 'Audit', pilot: 'PTSGN-POS-STAF-SPI-01', formasi: { units: ['PTSGN-HO-SPI'] },
    modules: [
      { code: 'PLT-SPI-01', role: 'lp', title: 'Auditor Internal: Dioptimalkan atau Dikerdilkan?', sheet: 'Auditor Internal - Dioptimalkan atau Dikerdilkan ?', row: 7, file: '1hnXwGtd12m2_L5puBGAtefTw6ZrMzaUJ', pages: 18 },
      { code: 'PLT-SPI-02', role: 'open', title: 'Pengelolaan Fungsi Audit Internal', sheet: 'Pengelolaan Fungsi Audit Internal', row: 8, file: '1tVQWlfagwxlALDll7gQKUpqpTVhld40n', pages: 76 },
      { code: 'PLT-SPI-03', role: 'open', title: 'Sistem Manajemen Kinerja', sheet: 'Sistem Manajemen Kinerja', row: 9, file: '19FHhvz0bRXFem3vR_GP3SSzWNzjNqFXo', pages: 62 },
      { code: 'PLT-SPI-04', role: 'open', title: 'Modul Lingkungan Strategis Organisasi', sheet: 'Modul Lingkungan Strategis Organisasi', row: 10, file: '1t2egQueACnr64BSxHNtuHbxnswrYo_L5', pages: 177 },
      { code: 'PLT-SPI-05', role: 'open', title: 'Lingkungan Strategis Organisasi', sheet: 'Lingkungan Strategis Organisasi', row: 11, file: '1Hs2HQs1ZS8eXnEjEDQ6BHGkNuIMvn3it', pages: 123 },
      { code: 'PLT-SPI-06', role: 'assigned', title: 'Teknik-Teknik Audit', sheet: 'Teknik-Teknik Audit', row: 13, file: '1haWo9z_vQ_xDnDouLGy-t5lX7y8xYURV', pages: 37 },
      { code: 'PLT-SPI-07', role: 'assigned', title: 'Pembuatan Program Audit', sheet: 'Pembuatan Program Audit', row: 14, slides: '16hEHP2QsYS2zLCqv3Z2wqFhnTsUXa5TV', pages: 123 },
      { code: 'PLT-SPI-08', role: 'assigned', title: 'Modul Pengelolaan Fungsi Audit Internal', sheet: 'Modul Pengelolaan Fungsi Audit Internal', row: 15, file: '1XQDix6ytB4rEnUM8ATCKz-9Lfel-2mIE', pages: 77 },
      { code: 'PLT-SPI-09', role: 'assigned', title: 'Modul Audit Internal', sheet: 'Modul Audit Internal ', row: 16, file: '1sK_FyxXE_vloGLjfnp5p0q3qeedqNgR8', pages: 61 },
    ],
  },
  {
    sheet: 'TEKPOL', unit: 'PTSGN-DIV-TEKPOL', category: 'Tekpol', pilot: 'PTSGN-POS-STAF-TEKPOL-01', formasi: { units: ['PTSGN-HO-TEKPOL'] },
    modules: [
      { code: 'PLT-TPL-01', role: 'lp', title: 'In House Training Pabrik Gula', sheet: 'IHT PG', row: 28, slides: '1Pla1Q9KLGmHD-1jVGUXfmvEXVvLm-ymJ', pages: 23 },
      { code: 'PLT-TPL-02', role: 'open', title: 'Melaksanakan Minimalisasi Limbah B3', sheet: 'Melaksanakan Minimalisasi Limbah B3', row: 29, file: '1dp5GIMHM94IAtukoA2ZLRljdWa_dwHd0', pages: 19 },
      { code: 'PLT-TPL-03', role: 'open', title: 'Sugarcane Processing Monitoring', sheet: 'Sugarcane Processing Monitoring', row: 30, file: '1o5Y4NUw0YR0kdIrEGxuzraEaHmThSe6I', pages: 64 },
      { code: 'PLT-TPL-04', role: 'open', title: 'Teknologi Pengendalian Pencemaran Udara dari Emisi', sheet: 'Teknologi Pengendalian Pencemaran Udara dari Emisi', row: 31, file: '1PVWIZTGVr4gj6YSYBwlXkVkPbwkDOL2j', pages: 59 },
      { code: 'PLT-TPL-05', role: 'open', title: 'Pre-Learning Manajemen Pabrik Kelapa Sawit, Gula, Karet, dan Teh (Modul 3)', sheet: 'PreLearning-ManajemenPabrikKelapaSawit-Gula-Karet-Teh (Modul 3)', row: 32, file: '1KHAorv2GAQzsrhoojxS3K1rqklmezbg-', pages: 54 },
      { code: 'PLT-TPL-06', role: 'open', title: 'Pre-Learning Manajemen Sipil dan Transportasi (Modul 3)', sheet: '27PreLearning-ManajemenSipildanTransportasi (Modul 3)', row: 33, file: '1H7r8xEqlJnrUQn2Upo-q6dpDT3nWmG5M', pages: 19 },
      { code: 'PLT-TPL-07', role: 'assigned', title: 'Peningkatan Kompetensi Masinis Pabrik Gula - Manajemen Pengolahan Gula', sheet: 'Peningkatan Kompetensi Masinis Pabrik Gula - Manajemen Pengolahan Gula', row: 34, file: '1X3D5keCdHoRx1NZafXjDdfO8y1hst2IW', pages: 66 },
      { code: 'PLT-TPL-08', role: 'assigned', title: 'Peningkatan Kompetensi Masinis Pabrik Gula - Kelistrikan di Pabrik', sheet: 'Peningkatan Kompetensi Masinis Pabrik Gula - Kelistrikan di Pabrik', row: 35, file: '1fUZx1KFDpaUp-jbHhpXAimclpNnjVmlO', pages: 86 },
    ],
  },
  {
    sheet: 'Sekper', unit: 'PTSGN-DIV-SEKPER', category: 'Culture', pilot: 'PTSGN-POS-STAF-SEKPER-01', formasi: { units: ['PTSGN-HO-SEKPER'] },
    modules: [
      { code: 'PLT-SKP-01', role: 'lp', title: 'Bekerja Keras, tapi Tetap Waras', sheet: 'Bekerja Keras, TapiTetapWaras', row: 45, file: '1XRimzLOYNr2JDgYKcqtndStbpRYsDeDR', pages: 19 },
      { code: 'PLT-SKP-02', role: 'open', title: 'Personal Branding', sheet: 'Personal Branding', row: 46, file: '1ooXLuBmqt64aoHMBBF1So3DMVdznWx0Q', pages: 18 },
      { code: 'PLT-SKP-03', role: 'open', title: 'Public Speaking & Presentation Skill', sheet: 'Public Speaking & Presentation Skill', row: 47, file: '1_RU2MXdt0FIzhqOE8VXfsjL2R-NglvkU', pages: 70 },
      { code: 'PLT-SKP-04', role: 'open', title: 'Creative Problem Solving & Decision Making', sheet: 'Creative Problem Solving & Decision Making', row: 48, file: '11fz2l4r4SDCGP7ads6wjaLJEpZgQpn3N', pages: 76 },
      { code: 'PLT-SKP-05', role: 'open', title: 'Intermediate Decision Making & Problem Solving', sheet: 'Intermediate Decision Making & Problem Solving ', row: 49, file: '1DsIXzsRPRt8s7YzJNI0h5jgjx0UZ2G8E', pages: 57 },
      { code: 'PLT-SKP-06', role: 'open', title: 'Managing Innovation 3', sheet: 'MANAGINGINNOVATION3', row: 50, file: '1aTxQPJtfPt4P2dd3hFZWR_kUbeh-YAlM', pages: 42 },
      { code: 'PLT-SKP-07', role: 'assigned', title: 'Sekretaris, Administrasi, dan Pengelolaan Administrasi Kantor (Bagian 1)', sheet: 'Pelatihan Bidang Sekretaris Administrasi Dan Pengelolaan Administrasi Kantor_1', row: 51, file: '1D3DI43pzZU5_rPRAmKhWWpnln62m83U2', pages: 146 },
      { code: 'PLT-SKP-08', role: 'assigned', title: 'Sekretaris, Administrasi, dan Pengelolaan Administrasi Kantor (Bagian 2)', sheet: 'Pelatihan Bidang Sekretaris Administrasi Dan Pengelolaan Administrasi Kantor_2', row: 52, file: '1eistByLfbFU8c6-vFcuGq7j6ok7zlVPZ', pages: 66 },
    ],
  },
  {
    sheet: null, unit: 'PTSGN-DIV-K3L', category: 'HSE & K3', pilot: 'PTSGN-POS-STAF-K3L-01', formasi: { units: ['PTSGN-HO-TEKPOL'], titles: ['Kasubdiv K3 & Lingkungan', 'Asisten K3'] },
    modules: [
      { code: 'PLT-K3L-01', role: 'lp', title: 'Dasar Kesehatan Kerja', sheet: 'Dasar Kesehatan Kerja', row: 63, file: '1Qeqk0TLnonN7AQpv6OB8G0xdJy-o_srQ', pages: 98 },
      { code: 'PLT-K3L-02', role: 'open', title: 'Dasar Kesehatan Kerja dan Peraturan Perundangan P3K di Tempat Kerja', sheet: 'Dasar Dasar Di Tempat Kerja -Dasar Kesehatan Kerja & Peraturan Perundangan P3k Di Tempat Kerja', row: 64, file: '1T4xaIatuldFZUXa-NIhytfvUCmBlKLeI', pages: 48 },
      { code: 'PLT-K3L-03', role: 'open', title: 'Identifikasi Potensi Bahaya & Tindakan K3', sheet: 'Identifikasi Potensi Bahaya & Tindakan K3', row: 65, file: '1UQUynYsXBbupd5tWRQ_Aq1dIQ7MVqE_b', pages: 26 },
      { code: 'PLT-K3L-04', role: 'open', title: 'Kebijakan K3', sheet: 'Materi_Kebijakan K3', row: 66, file: '1Wxy1Hb7tqz9hrEFJZRG-tB31YLlUjQgs', pages: 17 },
      { code: 'PLT-K3L-05', role: 'open', title: 'Undang-Undang 1970 dan Dasar-Dasar K3', sheet: 'Modul_UU 1970', row: 67, file: '12RAwAvyXIYGXquMyuWF47RgCAJ9Qn12B', pages: 76 },
      { code: 'PLT-K3L-06', role: 'open', title: 'Dasar-Dasar K3', sheet: 'Modul_Dasar-Dasar K3', row: 68, sameAs: 'PLT-K3L-05' },
      { code: 'PLT-K3L-07', role: 'open', title: 'Kelembagaan dan Keahlian K3', sheet: 'Modul_Kelembagaan Keahlian K3', row: 69, file: '1dd-jf1C7-btZYxKKLJtmHteoUNBhF6mv', pages: 31 },
      { code: 'PLT-K3L-08', role: 'open', title: 'Pengawasan Norma SMK3', sheet: 'Modul_Pengawasan Norma SMK3', row: 70, file: '1NSzjTWnSkIS8KoQPoqi6mrxkSZc5wrT7', pages: 49 },
      { code: 'PLT-K3L-09', role: 'open', title: 'Audit SMK3', sheet: 'Modul_Audit SMK3', row: 71, file: '1OxH8mSOrP21HNYMyEqx66Hdu2jX4pw6i', pages: 141 },
      { code: 'PLT-K3L-10', role: 'open', title: 'Manajemen Risiko', sheet: 'modul Manajemen Risiko', row: 72, file: '1nsAfe8HDc-4ZeywmQswM9UnDiZLmAM7M', pages: 73 },
    ],
  },
  {
    sheet: 'Divisi Tanaman', unit: 'PTSGN-DIV-TANAMAN', category: 'Tanaman', pilot: 'PTSGN-POS-STAF-TANAMAN-01', formasi: { units: ['PTSGN-HO-TANAMAN'] },
    modules: [
      { code: 'PLT-TAN-01', role: 'open', title: 'Sistem Kemitraan Tebu Rakyat', sheet: 'Sistem Kemitraan Tebu Rakyat', row: 83, file: '1Cf9PFegVU2Y_vT5mVq4D7rY8yHP3pFE9', pages: 43 },
      { code: 'PLT-TAN-02', role: 'open', title: 'Plantation Agribusiness Insight', sheet: 'PLantation Agribusiness Insight', row: 84, file: '1IyP-jHdP--YyoOXU5ZxCyreUVdokRY2E', pages: 21 },
      { code: 'PLT-TAN-03', role: 'open', title: 'Manajemen Usaha Tani Tebu', sheet: 'Manajemen Usaha Tani Tebu', row: 85, file: '1F8auPLZwmKQEbd67HalAseUZCP9gr9t-', pages: 42 },
      { code: 'PLT-TAN-04', role: 'open', title: 'Transformasi On Farm Tebu melalui Implementasi Operation Excellence', sheet: 'Transformasi On Farm Tebu melalui Implementasi Operation Excellence', row: 86, file: '1MEMsqVUoZdj3SQPHfSRYnC-UPJIGy53C', pages: 6 },
      { code: 'PLT-TAN-05', role: 'open', title: 'AMDAL untuk Usaha Perkebunan', sheet: 'AMDAL Untuk Usaha Perkebunan', row: 87, file: '1bEc4BJ6VeLf8DCOc1LgzQKDj0t-w_tL3', pages: 79 },
    ],
  },
  {
    sheet: 'SDM', unit: 'PTSGN-DIV-SDM', category: 'Human Capital', pilot: 'PTSGN-POS-STAF-SDM-01', formasi: { units: ['PTSGN-HO-PSDMB', 'PTSGN-HO-OSDM'] },
    modules: [
      { code: 'PLT-SDM-01', role: 'open', title: 'Peraturan Perusahaan & Perjanjian Kerja Bersama', sheet: 'Peraturan Perusahaan & Perjanjian Kerja Bersama', row: 100, file: '1fX6AlxKtegeNDC92St_EC5CDaV-shvb8', pages: 51 },
      { code: 'PLT-SDM-02', role: 'open', title: 'Perjanjian Kerja', sheet: 'Perjanjian Kerja ', row: 101, file: '1oNE14HIERTUNxXVlDrsvsY4ldbVsIigd', pages: 62 },
      { code: 'PLT-SDM-03', role: 'open', title: 'Penyelesaian Perselisihan Hubungan Industrial', sheet: 'Penyelesaiaan Perselisihan Hubungan Industrial ', row: 102, file: '1mqvj8AjSbk_zEvQl6OpgdZ3PeKnexHUw', pages: 73 },
      { code: 'PLT-SDM-04', role: 'open', title: 'LKS Bipartit: Manfaat, Pedoman, dan Teknik untuk Optimalisasi Pelaksanaan', sheet: 'LKS Bipartit : Manfaat, Pedoman, dan Teknik Untuk Optimalisasi Pelaksanaan', row: 103, file: '1O-cdRUlJAV_lHxjLriDqSX9IcHUq_FqR', pages: 36 },
      { code: 'PLT-SDM-05', role: 'open', title: 'Career Management: Menumbuhkan Karier dan Menguatkan Perusahaan', sheet: 'Career Management : Menumbuhkan Karir dan Menguatkan Perusahaan', row: 104, file: '1-waT4at-408XEPc1mWSeSV0kGcWtHuM4', fromFolder: '1irlKrcnVFT46XB8UvlBFQyO3b_GD-Ub9', pages: 36 },
      { code: 'PLT-SDM-06', role: 'assigned', title: 'From Skill Obsolescence to Skill Resilience', sheet: 'From Skill Obsolescence to Skill Resilience', row: 106, file: '1BPdtCtyKXQqGBt3kDrWoaxGEHmDcb2aM', pages: 25 },
      { code: 'PLT-SDM-07', role: 'assigned', title: 'Digitalization of Talent Management: Building Employee Experience & Productivity in the Age of AI', sheet: 'Digitalization of Talent Management : Building Employee Experience & Productivity in the Age of AI', row: 107, file: '1e14e8F10rNRvf5aPmvQbBbeqHuWKgPzp', pages: 31 },
      { code: 'PLT-SDM-08', role: 'assigned', title: 'Beyond Gen Z: Building Future-Ready Organizations for the Next Decade', sheet: 'Beyond Gen Z : Building Future Ready Organizations for the Next Decade', row: 108, file: '1ohGD8XTNWXSz9tgMMpUD-H0aCVZs48kN', pages: 13 },
    ],
  },
  {
    sheet: 'LitBang', unit: 'PTSGN-DIV-LITBANG', category: 'Tanaman', pilot: 'PTSGN-POS-STAF-LITBANG-01', formasi: { units: ['PTSGN-HO-LITBANG'] },
    modules: [
      { code: 'PLT-LIT-01', role: 'open', title: 'Teori Dasar dan Prinsip Kultur Jaringan Tanaman serta Pengendalian Mutu', sheet: 'Teori Dasar dan Prinsip  Kultur Jaringan Tanaman serta Pengendalian Mutu', row: 120, file: '1w_VNq4d5MHSA07Mniai6d_Ywt7CJp-4O', pages: 27 },
      { code: 'PLT-LIT-02', role: 'open', title: 'Pengenalan Laboratorium dan Persiapan Kerja', sheet: 'Pengenalan Laboratorium dan Persiapan Kerja', row: 121, file: '1WZ4MG54Oo7Tyo9ePRRHyH9mLHAF0usRH', pages: 33 },
      { code: 'PLT-LIT-03', role: 'open', title: 'Persyaratan dan Tata Kelola Laboratorium', sheet: 'Persyaratan dan Tata Kelola Laboratorium', row: 122, file: '1zFkDqK79qeY-XoPaRqwgapa_LXzvwo0l', pages: 33 },
      { code: 'PLT-LIT-04', role: 'open', title: 'Sterilisasi, Teknik Aseptik, dan Pengendalian Kontaminasi', sheet: 'Sterilisasi, teknik aseptik, dan pengendalian kontaminasi', row: 123, file: '1FqkNYSLbhi3XAuPuCrnpSPI6upYoLs6R', pages: 25 },
      { code: 'PLT-LIT-05', role: 'open', title: 'Teknik Multiplikasi, Perakaran, dan Aklimatisasi', sheet: 'Teknik Multiplikasi, perakaran, dan aklimatisasi', row: 124, file: '1BLCmfu4V2f9WRTuJ0-_GD6D9ct1iVhbi', pages: 34 },
    ],
  },
]

// Extra assignees named in the sheet's notes column for the SDM modules (G106 to G108): the career-management staff and
// every head of sub-division, and the head of talent. The demo has one sub-division in SDM, so these resolve to its head.
export const extraAssignees = {
  'PLT-SDM-06': ['PTSGN-POS-KASUBDIV-PSDMB'],
  'PLT-SDM-07': ['PTSGN-POS-KASUBDIV-PSDMB'],
  'PLT-SDM-08': ['PTSGN-POS-KASUBDIV-PSDMB'],
}
