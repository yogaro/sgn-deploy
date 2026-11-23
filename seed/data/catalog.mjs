// Self-paced courses with full material: video slides, a PDF handout, an article and pre/post quizzes.
// Content is written for the demo from general knowledge of sugar milling and the topics of the 2026 SDM letters.
// q: [prompt, correct, wrong1, wrong2, wrong3, explanation]
export const elearning = [
  {
    code: 'PGS-101', title: 'Dasar Proses Pengolahan Tebu menjadi Gula', category: 'Tekpol', owner: 'PTSGN-1037', hours: 6, certMonths: null,
    motif: 'factory', hue: 205,
    summary: 'Mengenal alur pabrik gula dari emplasemen sampai pengemasan, beserta tujuan tiap stasiun.',
    behavior: ['Menjelaskan tujuan tiap stasiun dan hubungannya kepada anggota tim.', 'Menggunakan istilah proses yang tepat saat melaporkan kondisi pabrik.'],
    competencies: ['Pengetahuan Proses Pabrik Gula'],
    slides: [
      ['Dari kebun ke gudang gula', ['Tebu ditimbang di emplasemen', 'Diolah menjadi nira, lalu dikristalkan', 'Gula dikeringkan, disaring, dikemas']],
      ['Persiapan dan gilingan', ['Pisau tebu dan unigrator memecah sel tebu', 'Gilingan memerah nira dengan imbibisi', 'Ampas menjadi bahan bakar ketel']],
      ['Pemurnian dan penguapan', ['Nira dipanaskan dan diberi kapur serta SO2', 'Kotoran diendapkan di clarifier', 'Evaporator memekatkan nira jernih menjadi nira kental']],
      ['Masakan dan putaran', ['Vacuum pan membentuk kristal sukrosa', 'Centrifuge memisahkan kristal dari tetes', 'Gula SHS dikeringkan dan dikemas']],
    ],
    article: `## Alur singkat pabrik gula

Pabrik gula mengubah tebu menjadi kristal sukrosa lewat serangkaian stasiun. Urutannya tetap sama di semua pabrik, yang berbeda hanya kapasitas dan peralatan.

### 1. Emplasemen dan persiapan
Tebu yang tiba di pabrik ditimbang, diambil sampelnya untuk analisa rendemen, lalu dimuat ke meja tebu. **Pisau tebu (cane cutter)** dan **unigrator** mencacah serta memecah sel tebu supaya nira mudah diperah.

### 2. Gilingan
Rangkaian gilingan memeras tebu beberapa kali. Air imbibisi disemprotkan di antara gilingan untuk membilas sisa nira. Hasilnya adalah *nira mentah* dan *ampas*. Ampas dipakai sebagai bahan bakar ketel uap.

### 3. Pemurnian
Nira mentah dipanaskan, diberi susu kapur dan gas SO2 (proses sulfitasi), lalu diendapkan di **clarifier**. Tujuannya membuang kotoran tanpa merusak sukrosa. Hasilnya *nira jernih*.

### 4. Penguapan
Nira jernih mengandung banyak air. **Evaporator** bertingkat (biasanya *quintuple effect*) menguapkan air sampai menjadi *nira kental* dengan Brix sekitar 60 persen.

### 5. Masakan dan putaran
Di **vacuum pan**, nira kental dimasak pada tekanan rendah sampai terbentuk kristal. Massa masakan lalu diputar di **centrifuge** untuk memisahkan kristal dari cairan induknya (tetes).

### 6. Pengeringan dan pengemasan
Kristal dikeringkan, diayak, dan dikemas menjadi gula kristal putih (SHS) siap kirim.

### Mengapa urutan ini penting
Kerugian gula di satu stasiun tidak bisa diperbaiki di stasiun berikutnya. Karena itu pengawas shift harus tahu apa yang terjadi di stasiun sebelum dan sesudah posisinya.`,
    questions: [
      ['Apa fungsi utama unigrator di stasiun persiapan?', 'Memecah sel tebu agar nira mudah diperah', 'Memisahkan kristal dari tetes', 'Menguapkan air dari nira', 'Menimbang tebu yang masuk', 'Unigrator dan pisau tebu membuka sel tebu sebelum masuk gilingan.'],
      ['Produk sampingan gilingan yang dipakai sebagai bahan bakar ketel adalah…', 'Ampas', 'Tetes', 'Blotong', 'Nira kental', 'Ampas tebu dibakar di ketel untuk menghasilkan uap.'],
      ['Alat yang memekatkan nira jernih menjadi nira kental adalah…', 'Evaporator', 'Clarifier', 'Centrifuge', 'Unigrator', 'Evaporator menguapkan air secara bertingkat.'],
      ['Tujuan proses pemurnian nira adalah…', 'Membuang kotoran tanpa merusak sukrosa', 'Menambah kadar air nira', 'Membentuk kristal gula', 'Mengeringkan gula', 'Pemurnian menghasilkan nira jernih untuk diuapkan.'],
      ['Kristal gula terbentuk di…', 'Vacuum pan', 'Gilingan', 'Meja tebu', 'Timbangan', 'Pemasakan pada tekanan rendah membentuk kristal.'],
      ['Cairan induk yang tersisa setelah kristal diputar disebut…', 'Tetes', 'Imbibisi', 'Nira mentah', 'Ampas', 'Tetes dipisahkan di centrifuge.'],
      ['Air imbibisi disemprotkan pada stasiun…', 'Gilingan', 'Pengemasan', 'Putaran', 'Pemurnian', 'Imbibisi membilas sisa nira dari ampas di antara gilingan.'],
      ['Benar atau salah: kerugian gula di satu stasiun dapat diperbaiki sepenuhnya di stasiun berikutnya.', 'Salah', 'Benar', 'Benar jika memakai evaporator baru', 'Benar jika ampasnya basah', 'Sukrosa yang hilang tidak dapat dikembalikan di stasiun lain.', 'TRUE_FALSE'],
    ],
  },
  {
    code: 'PGS-102', title: 'Pengendalian Mutu Nira dan Analisa Brix, Pol, Rendemen', category: 'Quality Assurance', owner: 'PTSGN-1038', hours: 8, certMonths: null,
    motif: 'lab', hue: 170,
    summary: 'Membaca hasil analisa laboratorium (Brix, Pol, HK) dan memakainya untuk mengendalikan proses harian.',
    behavior: ['Mengambil sampel nira sesuai jadwal dan prosedur.', 'Menindaklanjuti hasil analisa yang menyimpang dalam shift yang sama.'],
    competencies: ['Analisa Mutu Nira'],
    slides: [
      ['Tiga angka utama', ['Brix: zat padat terlarut dalam persen', 'Pol: kandungan sukrosa dalam persen', 'HK: harkat kemurnian = Pol dibagi Brix']],
      ['Titik sampling', ['Nira perahan pertama dan nira mentah', 'Nira jernih dan nira kental', 'Ampas akhir, tetes, dan gula produk']],
      ['Nilai nira', ['Nilai nira = Pol - 0,4 x (Brix - Pol)', 'Dipakai menghitung rendemen tebu', 'Semakin tinggi HK, semakin mudah dikristalkan']],
      ['Disiplin laboratorium', ['Kalibrasi refraktometer dan polarimeter berkala', 'Catat waktu dan lokasi sampel', 'Laporkan penyimpangan sebelum akhir shift']],
    ],
    article: `## Mengapa mutu nira dipantau terus

Setiap jam laboratorium pabrik mengambil sampel dari beberapa titik. Angka yang dihasilkan menjadi bahasa bersama antara bagian Tanaman, Pengolahan, dan Quality Assurance.

### Tiga angka dasar
- **Brix** adalah persentase zat padat terlarut dalam larutan, diukur dengan refraktometer atau hidrometer.
- **Pol** adalah persentase sukrosa, diukur dengan polarimeter dari putaran bidang cahaya terpolarisasi.
- **Harkat Kemurnian (HK)** adalah perbandingan Pol terhadap Brix dikalikan 100. HK tinggi berarti nira lebih murni dan lebih mudah dikristalkan.

### Titik pengambilan sampel
Nira perahan pertama (NPP) menggambarkan mutu tebu. Nira mentah, nira jernih, dan nira kental menunjukkan efektivitas gilingan, pemurnian, dan penguapan. Ampas dan tetes menunjukkan kehilangan gula.

### Nilai nira dan rendemen
Nilai nira dihitung dari Brix dan Pol dengan rumus **Pol - 0,4 x (Brix - Pol)**. Nilai ini dikalikan faktor rendemen untuk memperkirakan rendemen tebu giling, dasar perhitungan bagi hasil dengan petani.

### Praktik yang baik
1. Sampel diambil pada waktu dan titik yang sama setiap hari.
2. Alat dikalibrasi sesuai jadwal dan hasilnya dicatat.
3. Hasil di luar batas dilaporkan ke pengawas shift saat itu juga, bukan di akhir hari.`,
    questions: [
      ['Brix menyatakan…', 'Persentase zat padat terlarut', 'Persentase sukrosa', 'Kadar air ampas', 'Kekeruhan nira', 'Brix adalah zat padat terlarut total.'],
      ['Alat yang dipakai mengukur Pol adalah…', 'Polarimeter', 'Termometer', 'Manometer', 'Anemometer', 'Polarimeter mengukur putaran bidang cahaya oleh sukrosa.'],
      ['Harkat kemurnian (HK) dihitung dari…', 'Pol dibagi Brix dikali 100', 'Brix dibagi Pol dikali 100', 'Pol ditambah Brix', 'Brix dikurangi air', 'HK = Pol/Brix x 100.'],
      ['Rumus nilai nira adalah…', 'Pol - 0,4 x (Brix - Pol)', 'Brix + Pol', 'Pol x Brix', 'Brix - 0,4 x Pol', 'Rumus ini dipakai menghitung rendemen.'],
      ['Nira perahan pertama (NPP) menggambarkan…', 'Mutu tebu yang digiling', 'Kerja evaporator', 'Kehilangan di tetes', 'Kualitas kemasan', 'NPP berasal dari gilingan pertama.'],
      ['Jika hasil analisa menyimpang, tindakan yang benar adalah…', 'Melapor ke pengawas shift saat itu juga', 'Menunggu laporan harian', 'Mengubah angka agar sesuai target', 'Mengabaikan karena hanya satu sampel', 'Tindak lanjut cepat mencegah kerugian bertambah.'],
      ['Mana saja yang termasuk titik sampling proses? (pilih semua yang benar)', 'Nira mentah|Nira jernih|Nira kental', 'Kantor administrasi|Gudang suku cadang', '', '', 'Nira mentah, jernih, dan kental dipantau rutin.', 'MULTIPLE'],
      ['Benar atau salah: kalibrasi alat laboratorium cukup dilakukan sekali setahun tanpa dicatat.', 'Salah', 'Benar', 'Benar untuk refraktometer', 'Benar bila alatnya baru', 'Kalibrasi harus berkala dan tercatat.', 'TRUE_FALSE'],
    ],
  },
  {
    code: 'PGS-103', title: 'Pengawasan dan Setelan Stasiun Gilingan', category: 'Tekpol', owner: 'PTSGN-1039', hours: 7, certMonths: null,
    motif: 'gear', hue: 28,
    summary: 'Prinsip pemerahan di gilingan, setelan celah rol, tekanan hidrolik, imbibisi, dan indikator ekstraksi.',
    behavior: ['Memeriksa setelan gilingan di awal dan pertengahan shift.', 'Mencatat dan menindaklanjuti kadar pol ampas di atas batas.'],
    competencies: ['Pengoperasian Stasiun Gilingan', 'Pengetahuan Proses Pabrik Gula'],
    slides: [
      ['Prinsip pemerahan', ['Rol memeras tebu yang sudah dicacah', 'Tiap gilingan memiliki tiga rol utama', 'Celah dan tekanan menentukan ekstraksi']],
      ['Setelan gilingan', ['Celah rol atas ke rol depan dan belakang', 'Tekanan hidrolik sesuai beban tebu', 'Alur rol dijaga agar tidak aus']],
      ['Imbibisi', ['Air panas dibilaskan ke ampas antar-gilingan', 'Terlalu sedikit: pol ampas tinggi', 'Terlalu banyak: beban penguapan naik']],
      ['Indikator pengawasan', ['Ekstraksi pol dan kadar air ampas', 'Pol ampas dan Brix ampas', 'Arus motor dan suhu bantalan']],
    ],
    article: `## Gilingan: tempat pertama sukrosa bisa hilang

Gilingan memeras nira dari tebu yang telah dicacah. Satu **gilingan** biasanya terdiri atas tiga rol utama: rol atas, rol depan, dan rol belakang, ditambah rol pengumpan pada sebagian unit.

### Setelan yang menentukan hasil
- **Celah rol** harus sesuai dengan beban tebu. Terlalu rapat memicu kemacetan dan beban motor naik; terlalu longgar membuat nira tertinggal di ampas.
- **Tekanan hidrolik** pada rol atas menjaga tekanan pemerahan tetap stabil walau beban berubah.
- **Alur rol** (groove) membantu cengkeraman dan aliran nira. Alur yang aus menurunkan ekstraksi.

### Imbibisi
Air imbibisi dibilaskan ke ampas antar-gilingan. Jumlahnya dijaga pada kisaran yang ditetapkan pabrik, karena imbibisi berlebih menambah beban penguapan dan bahan bakar.

### Indikator
Pantau ekstraksi pol, kadar air ampas, serta pol ampas. Kenaikan pol ampas yang mendadak biasanya tanda setelan bergeser atau tebu yang diumpankan berubah. Arus motor dan suhu bantalan memberi peringatan dini kerusakan mekanis.

### Keselamatan
Rol dan roda gigi adalah titik jepit. Setiap pembersihan atau penyetelan di dekat gilingan wajib memakai prosedur **LOTO** (lock out, tag out).`,
    questions: [
      ['Tiga rol utama pada satu gilingan adalah…', 'Rol atas, depan, dan belakang', 'Rol kiri, kanan, dan tengah', 'Rol tebu, ampas, dan nira', 'Rol panas, dingin, dan basah', 'Susunan tiga rol adalah rancangan umum gilingan.'],
      ['Fungsi tekanan hidrolik pada rol atas adalah…', 'Menjaga tekanan pemerahan stabil saat beban berubah', 'Mendinginkan bantalan', 'Mencacah tebu', 'Menambah imbibisi', 'Hidrolik meredam perubahan beban.'],
      ['Celah rol terlalu longgar menyebabkan…', 'Nira tertinggal di ampas', 'Motor cepat panas', 'Tebu macet di meja', 'Kristal terlalu besar', 'Pemerahan menjadi kurang sempurna.'],
      ['Imbibisi berlebihan berakibat…', 'Beban penguapan dan bahan bakar naik', 'Pol ampas turun tanpa efek lain', 'Gula lebih putih', 'Tetes berkurang', 'Air tambahan harus diuapkan kembali.'],
      ['Kenaikan mendadak pol ampas biasanya menandakan…', 'Setelan bergeser atau umpan tebu berubah', 'Kemasan rusak', 'Clarifier bocor', 'Laboratorium salah libur', 'Periksa setelan dan umpan.'],
      ['Prosedur wajib sebelum membersihkan dekat gilingan adalah…', 'LOTO (lock out, tag out)', 'Menaikkan putaran', 'Menunggu shift berganti', 'Menyiram rol', 'Mesin harus dipastikan tidak bisa menyala.'],
      ['Alur rol yang aus akan…', 'Menurunkan ekstraksi', 'Meningkatkan ekstraksi', 'Tidak berpengaruh', 'Memperbaiki imbibisi', 'Cengkeraman dan aliran nira terganggu.'],
      ['Benar atau salah: arus motor dan suhu bantalan termasuk indikator peringatan dini kerusakan.', 'Benar', 'Salah', 'Salah, hanya pol ampas yang penting', 'Salah, hanya untuk ketel', 'Keduanya dipantau berkala.', 'TRUE_FALSE'],
    ],
  },
  {
    code: 'TAN-101', title: 'Budidaya Tebu serta Tebang, Muat, dan Angkut', category: 'Tanaman', owner: 'PTSGN-1041', hours: 6, certMonths: null,
    motif: 'cane', hue: 120,
    summary: 'Siklus tanam tebu, pemeliharaan, dan prinsip tebang muat angkut Manis, Bersih, Segar.',
    behavior: ['Menerapkan kriteria tebu Manis, Bersih, Segar pada setiap perintah tebang.', 'Mencatat jeda tebang-giling dan menindaklanjuti yang melewati batas.'],
    competencies: ['Budidaya dan Tebang Muat Angkut'],
    slides: [
      ['Siklus tanam', ['Tebu tanam (PC) lalu keprasan (RC)', 'Bibit bagal dengan mata tunas sehat', 'Umur masak optimal kira-kira 11 sampai 12 bulan']],
      ['Pemeliharaan', ['Pemupukan sesuai dosis rekomendasi', 'Pengairan dan pengendalian gulma', 'Pengendalian hama penggerek batang']],
      ['Tebang, muat, angkut', ['Tebang sesuai analisa kemasakan', 'Pucuk dan sogolan dibuang', 'Angkut segera menuju pabrik']],
      ['Manis, Bersih, Segar', ['Manis: brix cukup tinggi', 'Bersih: bebas kotoran dan daduk', 'Segar: jeda tebang-giling singkat']],
    ],
    article: `## Mutu gula dimulai di kebun

Rendemen yang baik tidak bisa dibentuk di pabrik kalau tebu yang masuk sudah rusak. Karena itu bagian Tanaman dan Pengolahan harus berbicara dengan angka yang sama.

### Siklus tanam
Tanaman pertama disebut *plant cane* (PC), tunas berikutnya setelah ditebang disebut *ratoon cane* (RC) atau keprasan. Bibit berasal dari bagal dengan mata tunas sehat, ditanam pada jarak antar-juringan sesuai rekomendasi pabrik dan kondisi lahan.

### Pemeliharaan
Pemupukan, pengairan, dan pengendalian gulma dilakukan sesuai fase pertumbuhan. Penggerek batang dan hama lain dipantau lewat pengamatan berkala supaya penanganannya cepat.

### Tebang, muat, angkut (TMA)
Urutan tebang disusun dari hasil **analisa kemasakan**, bukan sekadar luas atau jarak. Pada tahap tebang, pucuk, daun kering, dan sogolan dibuang. Muat dan angkut diatur agar tebu sampai di emplasemen secepat mungkin.

### Prinsip Manis, Bersih, Segar (MBS)
- **Manis**: ditebang saat kadar gula optimal.
- **Bersih**: bebas pucuk, daduk, tanah, dan sampah lain.
- **Segar**: jeda antara tebang dan giling dibuat sesingkat mungkin, karena sukrosa terurai seiring waktu.

Tebu yang tidak memenuhi MBS menurunkan rendemen dan menambah beban pemurnian.`,
    questions: [
      ['Tebu hasil tunas setelah ditebang disebut…', 'Keprasan (ratoon cane)', 'Tebu tanam (plant cane)', 'Bagal', 'Sogolan', 'Tunas dari tunggul disebut ratoon.'],
      ['Urutan tebang sebaiknya disusun berdasarkan…', 'Analisa kemasakan', 'Jarak lahan saja', 'Kemudahan akses semata', 'Permintaan sopir truk', 'Kemasakan menentukan kadar gula.'],
      ['Huruf M, B, S pada MBS adalah…', 'Manis, Bersih, Segar', 'Muat, Bongkar, Susun', 'Mesin, Bahan, Sumber daya', 'Mutu, Bobot, Syarat', 'Tiga kriteria tebu yang baik.'],
      ['Tebu dikatakan "segar" bila…', 'Jeda tebang sampai giling singkat', 'Tebu masih hijau', 'Dibasahi sebelum dikirim', 'Berasal dari kebun terdekat', 'Sukrosa terurai seiring waktu.'],
      ['Yang termasuk kotoran tebu adalah…', 'Pucuk, daduk, dan tanah', 'Batang masak', 'Nira', 'Ampas', 'Kotoran menurunkan rendemen.'],
      ['Bibit tebu yang baik berasal dari bagal dengan…', 'Mata tunas sehat', 'Daun lebar', 'Warna batang merah', 'Ruas terpanjang', 'Mata tunas menentukan pertumbuhan.'],
      ['Pengamatan hama berkala bertujuan…', 'Penanganan cepat sebelum meluas', 'Mengurangi jumlah pupuk', 'Mempercepat tebang', 'Menggantikan analisa kemasakan', 'Deteksi dini lebih murah.'],
      ['Benar atau salah: tebu bersih dan segar bisa menurunkan beban pemurnian.', 'Benar', 'Salah', 'Salah, tidak ada hubungan', 'Salah, hanya soal bobot', 'Kotoran dan nira yang terurai menyulitkan pemurnian.', 'TRUE_FALSE'],
    ],
  },
  {
    code: 'K3-101', title: 'Dasar Keselamatan dan Kesehatan Kerja Pabrik Gula', category: 'HSE & K3', owner: 'PTSGN-1043', hours: 4, certMonths: 24, required: true,
    motif: 'shield', hue: 8,
    summary: 'Bahaya utama di pabrik gula, hierarki pengendalian, APD, izin kerja, dan pelaporan nyaris celaka.',
    behavior: ['Memakai APD yang sesuai dan menegur rekan yang tidak memakainya.', 'Melaporkan nyaris celaka (near miss) pada hari kejadian.'],
    competencies: ['Keselamatan dan Kesehatan Kerja'],
    slides: [
      ['Bahaya di pabrik gula', ['Titik jepit di gilingan dan konveyor', 'Uap bertekanan dan permukaan panas', 'Ruang terbatas dan gas SO2']],
      ['Hierarki pengendalian', ['Eliminasi dan substitusi', 'Rekayasa teknik', 'Administrasi lalu APD sebagai pertahanan terakhir']],
      ['Izin kerja dan LOTO', ['Izin kerja panas dan ruang terbatas', 'Kunci dan tanda pada sumber energi', 'Uji gas sebelum masuk tangki']],
      ['Budaya melapor', ['Laporkan nyaris celaka hari itu juga', 'Tegur dengan sopan, bukan menyalahkan', 'Belajar dari kejadian, bukan menyembunyikan']],
    ],
    article: `## K3 adalah bagian dari pekerjaan, bukan tambahan

Setiap orang di pabrik gula bekerja berdampingan dengan mesin berputar, uap bertekanan, dan bahan kimia. Dasar hukumnya jelas: Undang-Undang No. 1 Tahun 1970 tentang Keselamatan Kerja dan Peraturan Pemerintah No. 50 Tahun 2012 tentang Sistem Manajemen K3 (SMK3).

### Bahaya yang paling sering
- **Titik jepit** pada gilingan, konveyor, dan roda gigi.
- **Uap dan permukaan panas** pada ketel, pipa, dan evaporator.
- **Ruang terbatas** seperti tangki dan clarifier yang bisa kekurangan oksigen atau mengandung gas.
- **Kebisingan dan debu** di area gilingan dan ketel.

### Hierarki pengendalian
Urutan upaya dari yang paling kuat: eliminasi, substitusi, rekayasa teknik, pengendalian administratif, lalu **alat pelindung diri (APD)** sebagai pertahanan terakhir. APD tidak menghilangkan bahaya, ia hanya mengurangi akibatnya.

### Izin kerja dan LOTO
Pekerjaan berisiko tinggi seperti kerja panas dan masuk ruang terbatas membutuhkan **izin kerja** tertulis. Sebelum memperbaiki mesin, sumber energinya dikunci dan diberi tanda (**lock out, tag out**), dan orang yang mengunci adalah orang yang membukanya.

### Melaporkan nyaris celaka
Nyaris celaka adalah kejadian yang hampir menimbulkan cedera. Satu laporan hari ini bisa mencegah kecelakaan minggu depan. Pabrik yang aman bukan pabrik tanpa laporan, melainkan pabrik tempat orang berani melapor.`,
    questions: [
      ['Peraturan yang mengatur Sistem Manajemen K3 adalah…', 'PP No. 50 Tahun 2012', 'UU No. 13 Tahun 2003 saja', 'PP No. 35 Tahun 2021', 'Perpres No. 16 Tahun 2018', 'PP 50/2012 mengatur SMK3.'],
      ['Urutan terakhir dalam hierarki pengendalian adalah…', 'Alat pelindung diri', 'Eliminasi', 'Substitusi', 'Rekayasa teknik', 'APD adalah pertahanan terakhir.'],
      ['Masuk ruang terbatas wajib didahului…', 'Izin kerja dan uji gas', 'Makan siang', 'Pergantian shift', 'Pemanasan mesin', 'Atmosfer harus dipastikan aman.'],
      ['Kepanjangan LOTO adalah…', 'Lock Out, Tag Out', 'Look Over, Tell Out', 'Load Off, Turn Off', 'Lift Out, Take Out', 'Mengunci dan menandai sumber energi.'],
      ['Nyaris celaka (near miss) sebaiknya dilaporkan…', 'Pada hari kejadian', 'Setelah ada korban', 'Saat audit', 'Tidak perlu dilaporkan', 'Pelaporan dini mencegah kejadian serupa.'],
      ['Siapa yang berhak membuka kunci LOTO?', 'Orang yang memasangnya', 'Siapa pun yang lewat', 'Pengawas yang tidak hadir', 'Petugas kebersihan', 'Kunci pribadi menjamin keselamatan pemasang.'],
      ['Yang termasuk bahaya di pabrik gula adalah… (pilih semua yang benar)', 'Titik jepit di gilingan|Uap bertekanan|Ruang terbatas', 'Cahaya matahari pagi|Suara musik', '', '', 'Ketiga bahaya pertama harus dikendalikan.', 'MULTIPLE'],
      ['Benar atau salah: APD menghilangkan sumber bahaya.', 'Salah', 'Benar', 'Benar untuk helm', 'Benar untuk sarung tangan', 'APD hanya mengurangi akibat.', 'TRUE_FALSE'],
    ],
  },
  {
    code: 'SM-101', title: 'Awareness ISO 14001 untuk Insan Sugar Group', category: 'Sistem Management', owner: 'PTSGN-1043', hours: 3, certMonths: null, required: true,
    motif: 'leaf', hue: 140,
    summary: 'Gambaran sistem manajemen lingkungan, aspek dan dampak lingkungan pabrik gula, serta peran setiap karyawan.',
    behavior: ['Memilah limbah B3 sesuai tempatnya di area kerja.', 'Menyampaikan potensi pencemaran kepada penanggung jawab lingkungan.'],
    competencies: ['Sistem Manajemen Lingkungan'],
    slides: [
      ['Apa itu ISO 14001', ['Standar sistem manajemen lingkungan', 'Berbasis siklus Plan, Do, Check, Act', 'Bertujuan perbaikan berkelanjutan']],
      ['Aspek dan dampak', ['Emisi ketel dan abu terbang', 'Limbah cair dan IPAL', 'Limbah B3: oli bekas, aki, kemasan bahan kimia']],
      ['Kepatuhan', ['Izin lingkungan dan baku mutu', 'Pelaporan berkala', 'Tindak lanjut temuan audit']],
      ['Peran Anda', ['Memilah dan menyimpan limbah dengan benar', 'Menghemat air dan energi', 'Melaporkan tumpahan atau kebocoran']],
    ],
    article: `## Lingkungan sebagai bagian dari operasi

**ISO 14001** adalah standar internasional untuk sistem manajemen lingkungan. Ia tidak menetapkan angka batas, tetapi mengharuskan organisasi mengetahui dampaknya, memenuhi kewajiban hukum, dan terus memperbaiki diri.

### Konsep dasar
Sistem berjalan dalam siklus **Plan–Do–Check–Act**: merencanakan, melaksanakan, memeriksa, dan memperbaiki. Pimpinan menetapkan kebijakan lingkungan, dan setiap unit menerjemahkannya ke sasaran yang terukur.

### Aspek dan dampak lingkungan pabrik gula
- **Emisi udara** dari ketel dan cerobong, dikendalikan antara lain dengan penangkap abu.
- **Air limbah** dari pencucian dan kondensat, diolah di IPAL sebelum dibuang.
- **Limbah padat**: ampas, abu ketel, dan blotong yang banyak dimanfaatkan kembali sebagai bahan bakar dan pupuk.
- **Limbah B3**: oli bekas, aki, kemasan bahan kimia, dan lampu, yang wajib disimpan di tempat penyimpanan sementara berizin.

### Kepatuhan
Izin lingkungan dan baku mutu harus dipenuhi, hasil pemantauan dilaporkan berkala, dan temuan audit ditindaklanjuti sampai tuntas.

### Peran setiap karyawan
Anda tidak perlu menjadi ahli lingkungan, tetapi Anda bisa memilah limbah sesuai wadahnya, menghemat air dan energi, serta segera melapor jika melihat tumpahan atau kebocoran.`,
    questions: [
      ['ISO 14001 adalah standar untuk…', 'Sistem manajemen lingkungan', 'Manajemen mutu', 'Keamanan informasi', 'Keselamatan kerja', 'Ini standar lingkungan.'],
      ['Siklus yang mendasari sistem manajemen adalah…', 'Plan, Do, Check, Act', 'Buy, Sell, Pay, Audit', 'Start, Stop, Pause, Go', 'Read, Write, Edit, Save', 'PDCA mendorong perbaikan berkelanjutan.'],
      ['Oli bekas termasuk limbah…', 'B3', 'Organik biasa', 'Plastik biasa', 'Kertas', 'Oli bekas adalah limbah bahan berbahaya dan beracun.'],
      ['Air limbah pabrik diolah di…', 'IPAL', 'Clarifier', 'Evaporator', 'Gudang gula', 'IPAL adalah instalasi pengolahan air limbah.'],
      ['Jika melihat tumpahan bahan kimia, langkah yang benar adalah…', 'Segera melapor ke penanggung jawab lingkungan', 'Membiarkannya mengering', 'Menyiramnya ke selokan', 'Menunggu laporan bulanan', 'Pelaporan cepat membatasi dampak.'],
      ['Blotong dan abu ketel dapat…', 'Dimanfaatkan kembali sebagai pupuk atau bahan bakar', 'Dibuang ke sungai', 'Dibakar terbuka', 'Dikubur tanpa izin', 'Pemanfaatan kembali mengurangi limbah.'],
      ['Siapa yang berperan dalam sistem manajemen lingkungan?', 'Seluruh karyawan', 'Hanya manajer', 'Hanya auditor', 'Hanya petugas kebersihan', 'Setiap karyawan memiliki peran.'],
      ['Benar atau salah: ISO 14001 menetapkan satu angka baku mutu yang sama untuk semua organisasi.', 'Salah', 'Benar', 'Benar untuk pabrik gula', 'Benar bila bersertifikat', 'Standar ini mensyaratkan sistem, bukan angka tunggal.', 'TRUE_FALSE'],
    ],
  },
  {
    code: 'SM-102', title: 'Pembaruan ISO 9001 dan Audit Rantai Pasok', category: 'Sistem Management', owner: 'PTSGN-1028', hours: 5, certMonths: null,
    motif: 'chain', hue: 262,
    summary: 'Pendekatan proses dan berpikir berbasis risiko, serta cara mengaudit pemasok dalam rantai pasok.',
    behavior: ['Menilai pemasok dengan daftar periksa yang sama untuk setiap kategori.', 'Menyimpan bukti audit pemasok agar dapat ditelusuri.'],
    competencies: ['Audit Mutu dan Rantai Pasok'],
    slides: [
      ['Pendekatan proses', ['Setiap proses punya masukan dan keluaran', 'Pemilik proses bertanggung jawab hasilnya', 'Indikator kinerja dipantau berkala']],
      ['Berpikir berbasis risiko', ['Identifikasi risiko dan peluang', 'Tindakan sebanding dengan dampak', 'Tinjau efektivitas tindakan']],
      ['Menilai pemasok', ['Kualifikasi sebelum bekerja sama', 'Evaluasi kinerja berkala', 'Audit lapangan untuk pemasok kritis']],
      ['Bukti dan penelusuran', ['Catatan batch dan sertifikat analisa', 'Temuan diklasifikasikan', 'Tindak lanjut dipantau sampai tutup']],
    ],
    article: `## Mutu tidak berhenti di gerbang pabrik

Bahan kimia, suku cadang, kemasan, dan jasa angkutan yang masuk ikut menentukan mutu gula. Karena itu audit mutu tidak cukup memeriksa pabrik sendiri.

### Pendekatan proses dan risiko
Sistem manajemen mutu ISO 9001 memandang organisasi sebagai kumpulan proses yang saling terkait. Setiap proses punya pemilik, masukan, keluaran, dan indikator. Standar juga meminta **berpikir berbasis risiko**: mengenali apa yang dapat salah, lalu mengambil tindakan yang sebanding dengan dampaknya.

### Audit rantai pasok
Audit pemasok menjawab pertanyaan: apakah pemasok mampu memenuhi persyaratan kita secara konsisten? Langkahnya:
1. **Kualifikasi** awal: legalitas, kapasitas, dan sertifikasi.
2. **Evaluasi kinerja** berkala: ketepatan waktu, kesesuaian spesifikasi, penanganan keluhan.
3. **Audit lapangan** untuk pemasok kritis, termasuk ketertelusuran batch.

### Temuan dan tindak lanjut
Temuan diklasifikasikan berdasarkan tingkat keparahan, pemasok menyampaikan rencana perbaikan, dan pemantauan berlanjut sampai temuan ditutup dengan bukti.

Catatan: ISO terus merevisi standarnya. Selalu rujuk versi yang berlaku dan kebijakan perusahaan.`,
    questions: [
      ['Pendekatan proses memandang organisasi sebagai…', 'Kumpulan proses yang saling terkait', 'Daftar departemen terpisah', 'Hierarki jabatan', 'Kumpulan dokumen', 'Setiap proses memiliki masukan dan keluaran.'],
      ['Berpikir berbasis risiko berarti…', 'Tindakan sebanding dengan dampak risiko', 'Menghindari semua perubahan', 'Menambah dokumen sebanyak mungkin', 'Menunda keputusan', 'Fokus pada apa yang dapat salah.'],
      ['Tahap pertama dalam menilai pemasok adalah…', 'Kualifikasi awal', 'Pembayaran', 'Audit lapangan', 'Pemutusan kontrak', 'Kualifikasi dilakukan sebelum bekerja sama.'],
      ['Audit lapangan terutama dilakukan untuk…', 'Pemasok kritis', 'Semua pemasok tanpa kecuali', 'Pemasok yang baru dihubungi', 'Pemasok yang memberi diskon', 'Prioritas berdasar dampak.'],
      ['Temuan audit sebaiknya…', 'Diklasifikasikan dan ditindaklanjuti sampai tutup', 'Diabaikan', 'Disimpan tanpa dibahas', 'Dihapus bila pemasok keberatan', 'Tindak lanjut membuktikan perbaikan.'],
      ['Bukti ketertelusuran meliputi…', 'Catatan batch dan sertifikat analisa', 'Daftar menu kantin', 'Foto kantor', 'Jadwal rapat', 'Dokumen ini menelusuri asal bahan.'],
      ['Pemilik proses bertanggung jawab atas…', 'Hasil dan kinerja proses', 'Seluruh pemasok', 'Anggaran perusahaan', 'Perekrutan', 'Pemilik proses menjaga indikator.'],
      ['Benar atau salah: mutu hanya ditentukan oleh proses di dalam pabrik sendiri.', 'Salah', 'Benar', 'Benar jika pemasok bersertifikat', 'Benar untuk gula premium', 'Pemasok ikut menentukan mutu.', 'TRUE_FALSE'],
    ],
  },
  {
    code: 'AUD-101', title: 'Dasar-dasar Audit Internal', category: 'Audit', owner: 'PTSGN-1028', hours: 8, certMonths: null,
    motif: 'magnify', hue: 225,
    summary: 'Tahapan audit, penyusunan temuan, bukti audit, serta sikap independen dan objektif.',
    behavior: ['Menyusun temuan dengan struktur kriteria, kondisi, sebab, dan akibat.', 'Menjaga independensi dan menolak pemberian dari auditi.'],
    competencies: ['Audit Internal'],
    slides: [
      ['Tahapan audit', ['Perencanaan dan penetapan ruang lingkup', 'Pelaksanaan dan pengumpulan bukti', 'Pelaporan dan pemantauan tindak lanjut']],
      ['Bukti audit', ['Cukup, relevan, dan andal', 'Wawancara, observasi, inspeksi, analisis', 'Dokumentasikan di kertas kerja']],
      ['Menyusun temuan', ['Kriteria: apa yang seharusnya', 'Kondisi: apa yang terjadi', 'Sebab, akibat, dan rekomendasi']],
      ['Sikap auditor', ['Independen dan objektif', 'Menjaga kerahasiaan', 'Kompeten dan berhati-hati secara profesional']],
    ],
    article: `## Audit internal sebagai jaminan dan pembelajaran

Audit internal memberi keyakinan independen kepada manajemen tentang apakah pengendalian, manajemen risiko, dan tata kelola berjalan seperti seharusnya. Praktiknya mengacu pada standar profesi internasional audit internal.

### Tahapan
1. **Perencanaan**: memahami proses, menilai risiko, menetapkan ruang lingkup dan program kerja.
2. **Pelaksanaan**: mengumpulkan bukti lewat wawancara, observasi, inspeksi dokumen, dan analisis data, lalu mencatatnya di kertas kerja.
3. **Pelaporan**: menyampaikan hasil secara jelas dan tepat waktu.
4. **Pemantauan tindak lanjut**: memastikan rekomendasi benar-benar dijalankan.

### Bukti audit
Bukti harus **cukup**, **relevan**, dan **andal**. Dokumen yang dihasilkan pihak luar umumnya lebih andal daripada yang dibuat auditi sendiri.

### Struktur temuan
Temuan yang baik menjawab lima hal: **kriteria** (yang seharusnya), **kondisi** (yang terjadi), **sebab**, **akibat**, dan **rekomendasi**.

### Sikap profesional
Auditor harus independen dan objektif, menjaga kerahasiaan, serta tidak menerima pemberian yang dapat mengurangi objektivitas. Audit yang baik tidak mencari siapa yang salah, melainkan mencari apa yang bisa diperbaiki.`,
    questions: [
      ['Urutan tahapan audit yang benar adalah…', 'Perencanaan, pelaksanaan, pelaporan, tindak lanjut', 'Pelaporan, perencanaan, pelaksanaan, tindak lanjut', 'Pelaksanaan, perencanaan, tindak lanjut, pelaporan', 'Tindak lanjut, pelaksanaan, perencanaan, pelaporan', 'Mengikuti siklus audit.'],
      ['Bukti audit yang baik harus…', 'Cukup, relevan, dan andal', 'Banyak tanpa dipilah', 'Berasal dari satu sumber saja', 'Berupa pendapat auditor', 'Tiga sifat bukti.'],
      ['"Kriteria" dalam temuan audit berarti…', 'Apa yang seharusnya terjadi', 'Apa yang sebenarnya terjadi', 'Siapa yang bertanggung jawab', 'Berapa kerugiannya', 'Kriteria adalah patokan.'],
      ['"Kondisi" dalam temuan audit berarti…', 'Fakta yang ditemukan', 'Aturan yang berlaku', 'Saran perbaikan', 'Biaya audit', 'Kondisi adalah apa yang ada.'],
      ['Bila auditi menawarkan hadiah, auditor harus…', 'Menolak dan melaporkan sesuai kode etik', 'Menerima asal kecil', 'Menerima setelah audit selesai', 'Menyimpannya diam-diam', 'Objektivitas harus dijaga.'],
      ['Pemantauan tindak lanjut bertujuan…', 'Memastikan rekomendasi dijalankan', 'Menambah temuan baru', 'Menghukum auditi', 'Mengganti auditor', 'Rekomendasi harus berujung perbaikan.'],
      ['Teknik pengumpulan bukti audit antara lain… (pilih semua yang benar)', 'Wawancara|Observasi|Inspeksi dokumen', 'Menebak|Menyalin laporan lama', '', '', 'Bukti dikumpulkan dengan teknik yang dapat diverifikasi.', 'MULTIPLE'],
      ['Benar atau salah: tujuan utama audit adalah mencari siapa yang bersalah.', 'Salah', 'Benar', 'Benar untuk temuan berat', 'Benar bila diminta pimpinan', 'Fokusnya perbaikan sistem.', 'TRUE_FALSE'],
    ],
  },
  {
    code: 'AUD-102', title: 'Pengujian Desain dan Efektivitas Pengendalian ICoFR', category: 'Audit', owner: 'PTSGN-1028', hours: 6, certMonths: null,
    motif: 'check', hue: 250,
    summary: 'Konsep ICoFR berdasarkan kerangka COSO, Test of Design, Test of Effectiveness, dan klasifikasi defisiensi.',
    behavior: ['Menyiapkan bukti pengujian kontrol sesuai sampel yang ditetapkan.', 'Mengklasifikasikan defisiensi dengan alasan tertulis.'],
    competencies: ['Audit Internal', 'Pengendalian Internal Pelaporan Keuangan'],
    slides: [
      ['Apa itu ICoFR', ['Pengendalian internal atas pelaporan keuangan', 'Mengacu kerangka COSO', 'Lima komponen pengendalian']],
      ['Test of Design', ['Apakah kontrol dirancang memadai?', 'Walkthrough satu transaksi dari awal sampai akhir', 'Cocokkan dengan risiko di RCM']],
      ['Test of Effectiveness', ['Apakah kontrol berjalan sepanjang periode?', 'Ambil sampel sesuai populasi dan frekuensi', 'Catat pengecualian']],
      ['Klasifikasi defisiensi', ['Defisiensi kontrol', 'Defisiensi signifikan', 'Kelemahan material']],
    ],
    article: `## ICoFR dan dua jenis pengujian

**ICoFR** (Internal Control over Financial Reporting) adalah pengendalian internal atas pelaporan keuangan. Kerangka yang lazim dipakai adalah COSO, yang membagi pengendalian menjadi lima komponen: lingkungan pengendalian, penilaian risiko, aktivitas pengendalian, informasi dan komunikasi, serta pemantauan.

### Risk Control Matrix (RCM)
RCM memetakan risiko pelaporan keuangan ke kontrol yang meredamnya. Dari sinilah pengujian disusun.

### Test of Design (ToD)
ToD menilai apakah kontrol **dirancang** dengan memadai untuk mencegah atau mendeteksi kesalahan material. Cara umum: *walkthrough* satu transaksi dari awal hingga pencatatan, lalu mencocokkannya dengan RCM.

### Test of Effectiveness (ToE)
ToE menilai apakah kontrol yang dirancang **berjalan** secara konsisten sepanjang periode. Auditor mengambil sampel sesuai ukuran populasi dan frekuensi kontrol (harian, mingguan, bulanan), lalu mencatat setiap pengecualian.

### Klasifikasi defisiensi
- **Defisiensi kontrol**: kontrol tidak berjalan atau dirancang kurang baik.
- **Defisiensi signifikan**: cukup penting untuk dilaporkan kepada pengawas tata kelola.
- **Kelemahan material**: ada kemungkinan wajar laporan keuangan salah saji secara material tidak tercegah atau terdeteksi tepat waktu.`,
    questions: [
      ['Kerangka yang umum dipakai untuk ICoFR adalah…', 'COSO', 'ITIL', 'PMBOK', 'TOGAF', 'COSO membagi pengendalian menjadi lima komponen.'],
      ['Test of Design menilai…', 'Apakah kontrol dirancang memadai', 'Apakah kontrol berjalan sepanjang periode', 'Berapa gaji pemilik kontrol', 'Kecepatan jaringan', 'ToD fokus pada desain.'],
      ['Test of Effectiveness menilai…', 'Apakah kontrol berjalan konsisten', 'Apakah kontrol mudah dibaca', 'Apakah tim senang', 'Jumlah dokumen', 'ToE menguji operasi kontrol.'],
      ['Walkthrough dilakukan dengan…', 'Menelusuri satu transaksi dari awal sampai akhir', 'Membaca seluruh buku besar', 'Mewawancarai direksi saja', 'Mencetak laporan', 'Walkthrough memperlihatkan alur nyata.'],
      ['RCM memetakan…', 'Risiko ke kontrol yang meredamnya', 'Karyawan ke gaji', 'Unit ke lokasi', 'Biaya ke tahun', 'RCM adalah dasar pengujian.'],
      ['Tingkat paling berat dari klasifikasi defisiensi adalah…', 'Kelemahan material', 'Defisiensi kontrol', 'Defisiensi signifikan', 'Pengecualian kecil', 'Kelemahan material berpotensi salah saji material.'],
      ['Ukuran sampel ToE dipengaruhi oleh…', 'Frekuensi kontrol dan ukuran populasi', 'Warna dokumen', 'Hari pengujian', 'Jumlah auditor', 'Semakin sering kontrol, semakin besar sampel.'],
      ['Benar atau salah: ToD cukup untuk membuktikan kontrol berjalan sepanjang tahun.', 'Salah', 'Benar', 'Benar bila desain bagus', 'Benar untuk kontrol otomatis saja', 'Perlu ToE untuk operasi kontrol.', 'TRUE_FALSE'],
    ],
  },
  {
    code: 'PRC-101', title: 'Precision Procurement: Spesifikasi dan Harga Perkiraan Sendiri', category: 'Procurement', owner: 'PTSGN-1025', hours: 5, certMonths: null,
    motif: 'box', hue: 190,
    summary: 'Menulis spesifikasi yang jelas dan menyusun HPS atau owner estimate yang akurat dan dapat dipertanggungjawabkan.',
    behavior: ['Menulis spesifikasi tanpa mengarah pada merek atau penyedia tertentu.', 'Mendokumentasikan sumber harga setiap komponen HPS.'],
    competencies: ['Pengadaan Barang dan Jasa'],
    slides: [
      ['Spesifikasi yang jelas', ['Berbasis kebutuhan dan kinerja', 'Terukur dan dapat diuji', 'Tidak mengarah pada merek tertentu']],
      ['Sumber data harga', ['Survei pasar dan penawaran', 'Kontrak serupa sebelumnya', 'Katalog dan harga resmi']],
      ['Menyusun HPS', ['Rincian per komponen', 'Biaya transport, pajak, dan margin wajar', 'Catat sumber dan tanggal']],
      ['Kesalahan umum', ['Spesifikasi menyalin brosur satu merek', 'HPS tanpa dokumentasi sumber', 'Tidak melibatkan pengguna akhir']],
    ],
    article: `## Pengadaan yang baik dimulai dari spesifikasi yang baik

Sebagian besar sengketa dan pengadaan ulang bersumber dari dua hal: spesifikasi yang tidak jelas dan perkiraan harga yang tidak akurat. Pelatihan ini membahas keduanya.

### Spesifikasi yang jelas
Spesifikasi menjelaskan **apa yang dibutuhkan**, bukan **siapa yang menyediakan**. Prinsipnya:
- berbasis kebutuhan dan kinerja;
- terukur dan dapat diuji saat penerimaan;
- tidak mengarah pada merek atau penyedia tertentu;
- disusun bersama pengguna akhir.

### Harga Perkiraan Sendiri (HPS) / owner estimate
HPS adalah perkiraan biaya yang dihitung secara keahlian dan dipakai sebagai acuan evaluasi penawaran. HPS disusun dari data yang dapat ditelusuri: survei pasar, penawaran, kontrak serupa sebelumnya, serta katalog resmi. Setiap komponen mencantumkan **sumber dan tanggalnya**.

### Yang perlu dihitung
Harga barang, biaya angkut dan instalasi, pajak, serta keuntungan dan overhead yang wajar. Satuan dan volume harus konsisten dengan spesifikasi.

### Kesalahan yang sering terjadi
Menyalin brosur satu merek, tidak mendokumentasikan sumber harga, dan menyusun HPS tanpa melibatkan pengguna akhir. Semuanya mudah dihindari bila dari awal dicatat dengan rapi.

Pengadaan mengikuti pedoman pengadaan barang dan jasa BUMN serta kebijakan perusahaan yang berlaku.`,
    questions: [
      ['Spesifikasi yang baik menjelaskan…', 'Apa yang dibutuhkan', 'Siapa penyedianya', 'Berapa komisinya', 'Kapan rapat dilakukan', 'Fokus pada kebutuhan dan kinerja.'],
      ['Spesifikasi yang menyebut satu merek tertentu berisiko…', 'Mengarah pada penyedia tertentu', 'Menurunkan harga', 'Mempercepat pengadaan', 'Menjamin mutu', 'Persaingan menjadi tidak sehat.'],
      ['HPS singkatan dari…', 'Harga Perkiraan Sendiri', 'Harga Pokok Sementara', 'Harga Pasar Standar', 'Hasil Penawaran Sah', 'HPS adalah owner estimate.'],
      ['Sumber data HPS yang baik antara lain…', 'Survei pasar, penawaran, dan kontrak sebelumnya', 'Perkiraan pribadi', 'Pendapat satu penyedia', 'Harga tahun lalu tanpa penyesuaian', 'Data harus dapat ditelusuri.'],
      ['Dokumentasi HPS sebaiknya mencantumkan…', 'Sumber dan tanggal tiap komponen', 'Nama penyedia favorit', 'Hanya total akhir', 'Jumlah peserta rapat', 'Agar dapat dipertanggungjawabkan.'],
      ['Siapa yang sebaiknya dilibatkan dalam menyusun spesifikasi?', 'Pengguna akhir', 'Hanya bagian keuangan', 'Hanya penyedia', 'Tidak seorang pun', 'Pengguna paling tahu kebutuhan.'],
      ['Komponen yang masuk perhitungan HPS meliputi… (pilih semua yang benar)', 'Harga barang|Biaya angkut|Pajak', 'Hadiah untuk penyedia|Biaya hiburan', '', '', 'Komponen biaya wajar saja.', 'MULTIPLE'],
      ['Benar atau salah: HPS cukup berupa satu angka tanpa rincian.', 'Salah', 'Benar', 'Benar untuk nilai kecil', 'Benar bila pengguna setuju', 'Rincian diperlukan agar dapat diuji.', 'TRUE_FALSE'],
    ],
  },
  {
    code: 'CUL-101', title: 'AKHLAK dan Kode Etik Perusahaan', category: 'Culture', owner: 'PTSGN-1035', hours: 3, certMonths: null, required: true,
    motif: 'heart', hue: 340,
    summary: 'Enam nilai utama BUMN, benturan kepentingan, gratifikasi, dan saluran pelaporan pelanggaran.',
    behavior: ['Menolak gratifikasi dan melaporkannya sesuai prosedur.', 'Mengungkapkan benturan kepentingan sebelum mengambil keputusan.'],
    competencies: ['Nilai AKHLAK'],
    slides: [
      ['Enam nilai AKHLAK', ['Amanah dan Kompeten', 'Harmonis dan Loyal', 'Adaptif dan Kolaboratif']],
      ['Benturan kepentingan', ['Kepentingan pribadi bertemu tugas', 'Ungkapkan sebelum memutuskan', 'Hindari ikut memutus']],
      ['Gratifikasi', ['Pemberian yang berhubungan dengan jabatan', 'Tolak atau laporkan', 'Gunakan saluran resmi']],
      ['Melapor dengan aman', ['Sistem pelaporan pelanggaran', 'Identitas pelapor dilindungi', 'Laporan ditindaklanjuti']],
    ],
    article: `## Nilai yang dijalankan, bukan hanya dihafal

BUMN memiliki enam nilai utama **AKHLAK**:
- **A**manah: memegang teguh kepercayaan yang diberikan.
- **K**ompeten: terus belajar dan mengembangkan kapabilitas.
- **H**armonis: saling peduli dan menghargai perbedaan.
- **L**oyal: berdedikasi pada bangsa dan negara serta mengutamakan kepentingan organisasi.
- **A**daptif: terus berinovasi dan antusias menggerakkan perubahan.
- **K**olaboratif: membangun kerja sama yang sinergis.

### Benturan kepentingan
Terjadi ketika kepentingan pribadi, keluarga, atau kelompok berpotensi memengaruhi keputusan jabatan. Langkah yang tepat: **ungkapkan** kepada atasan dan hindari ikut memutuskan.

### Gratifikasi
Pemberian dalam arti luas yang berhubungan dengan jabatan dan bertentangan dengan tugas wajib dapat dikategorikan gratifikasi. Tolak bila memungkinkan; bila tidak, laporkan lewat saluran yang ditetapkan perusahaan.

### Melapor dengan aman
Perusahaan menyediakan sistem pelaporan pelanggaran. Identitas pelapor dilindungi dan laporan ditindaklanjuti. Budaya yang sehat mendorong orang bicara, bukan diam.`,
    questions: [
      ['Huruf A pertama pada AKHLAK adalah…', 'Amanah', 'Adaptif', 'Aktif', 'Akurat', 'Urutannya Amanah, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif.'],
      ['Nilai "Kolaboratif" berarti…', 'Membangun kerja sama yang sinergis', 'Bekerja sendiri', 'Bersaing antar unit', 'Menunggu perintah', 'Kolaborasi lintas fungsi.'],
      ['Benturan kepentingan sebaiknya…', 'Diungkapkan dan tidak ikut memutuskan', 'Disembunyikan', 'Diselesaikan sendiri', 'Diabaikan jika kecil', 'Transparansi menjaga objektivitas.'],
      ['Jika menerima pemberian terkait jabatan yang tidak bisa ditolak, Anda harus…', 'Melaporkan lewat saluran resmi', 'Menyimpannya', 'Membagikan ke teman', 'Menjualnya', 'Laporkan agar ditindaklanjuti.'],
      ['Nilai "Amanah" berarti…', 'Memegang teguh kepercayaan', 'Bekerja cepat saja', 'Menghindari tanggung jawab', 'Menunggu instruksi', 'Amanah adalah kepercayaan.'],
      ['Pelaporan pelanggaran sebaiknya dilakukan lewat…', 'Saluran resmi perusahaan', 'Media sosial', 'Gosip antar rekan', 'Surat kaleng ke luar', 'Saluran resmi melindungi pelapor.'],
      ['Mana saja yang termasuk nilai AKHLAK? (pilih semua yang benar)', 'Harmonis|Loyal|Adaptif', 'Kompetitif|Agresif', '', '', 'Enam nilai resmi BUMN.', 'MULTIPLE'],
      ['Benar atau salah: identitas pelapor pelanggaran wajib diumumkan.', 'Salah', 'Benar', 'Benar untuk pelanggaran berat', 'Benar bila diminta atasan', 'Identitas pelapor dilindungi.', 'TRUE_FALSE'],
    ],
  },
  {
    code: 'DAT-101', title: 'Data Storytelling dan Analisis Akar Masalah', category: 'Data & Analitik', owner: 'PTSGN-1036', hours: 4, certMonths: null,
    motif: 'chart', hue: 45,
    summary: 'Menyajikan data sebagai cerita yang mendorong keputusan, serta menemukan akar masalah dengan 5 Whys dan fishbone.',
    behavior: ['Menyajikan laporan dengan satu pesan utama dan grafik yang sesuai.', 'Memakai analisis akar masalah sebelum mengusulkan perbaikan.'],
    competencies: ['Analisis Data dan Pemecahan Masalah'],
    slides: [
      ['Data jadi cerita', ['Mulai dari pesan, bukan dari tabel', 'Satu grafik satu gagasan', 'Akhiri dengan tindakan yang diminta']],
      ['Memilih grafik', ['Garis untuk tren waktu', 'Batang untuk perbandingan', 'Hindari grafik pai dengan banyak irisan']],
      ['Analisis akar masalah', ['Rumuskan masalah secara spesifik', '5 Whys: tanya mengapa berulang', 'Fishbone: kelompokkan penyebab']],
      ['Memprioritaskan', ['Pareto: 20 persen penyebab, 80 persen dampak', 'Uji penyebab dengan data', 'Tetapkan tindakan, pemilik, dan tenggat']],
    ],
    article: `## Angka tidak berbicara sendiri

Laporan yang penuh angka sering gagal menggerakkan keputusan karena pembaca harus menyimpulkan sendiri. **Data storytelling** menggabungkan tiga hal: data, visual, dan narasi.

### Menyusun cerita
1. Tentukan **pesan utama** satu kalimat. Contoh: "Kehilangan pol di ampas naik tiga minggu berturut-turut."
2. Pilih grafik yang cocok: garis untuk tren, batang untuk perbandingan.
3. Sorot hal penting, hapus hiasan yang tidak perlu.
4. Tutup dengan **tindakan** yang diharapkan dari pembaca.

### Analisis akar masalah
Sebelum memperbaiki, pastikan yang diperbaiki adalah penyebabnya, bukan gejalanya.
- **5 Whys**: tanyakan "mengapa" berulang sampai ketemu penyebab yang bisa ditindak.
- **Fishbone (Ishikawa)**: kelompokkan penyebab menjadi manusia, mesin, metode, material, lingkungan, dan pengukuran.
- **Pareto**: sebagian kecil penyebab biasanya menyumbang sebagian besar dampak; kerjakan yang terbesar dulu.

### Dari analisis ke tindakan
Setiap penyebab yang terbukti perlu punya tindakan, pemilik, dan tenggat. Tanpa itu, analisis hanya menjadi dokumen.`,
    questions: [
      ['Langkah pertama menyusun data storytelling adalah…', 'Menentukan pesan utama', 'Memilih warna', 'Menambah animasi', 'Menyalin semua tabel', 'Pesan memandu pilihan visual.'],
      ['Grafik yang cocok untuk tren waktu adalah…', 'Grafik garis', 'Grafik pai', 'Peta panas', 'Tabel berwarna', 'Garis memperlihatkan perubahan.'],
      ['Metode "5 Whys" dilakukan dengan…', 'Bertanya mengapa berulang', 'Mengundang lima ahli', 'Menunda lima hari', 'Menulis lima laporan', 'Sampai menemukan akar yang dapat ditindak.'],
      ['Fishbone mengelompokkan penyebab menjadi…', 'Manusia, mesin, metode, material, lingkungan, pengukuran', 'Hanya biaya', 'Hanya waktu', 'Hanya orang', 'Enam kategori klasik.'],
      ['Prinsip Pareto menyatakan…', 'Sedikit penyebab menyumbang dampak terbesar', 'Semua penyebab sama penting', 'Dampak tidak dapat diukur', 'Penyebab selalu satu', 'Prioritaskan penyebab terbesar.'],
      ['Setelah akar masalah ditemukan, langkah berikutnya adalah…', 'Menetapkan tindakan, pemilik, dan tenggat', 'Mengarsipkan laporan', 'Menunggu masalah hilang', 'Mengganti grafik', 'Analisis harus berujung tindakan.'],
      ['Yang sebaiknya dihindari dalam visual data adalah… (pilih semua yang benar)', 'Pai dengan banyak irisan|Hiasan berlebihan', 'Judul yang menyatakan pesan|Sumbu yang jelas', '', '', 'Visual harus menyederhanakan.', 'MULTIPLE'],
      ['Benar atau salah: memperbaiki gejala sama efektifnya dengan memperbaiki akar masalah.', 'Salah', 'Benar', 'Benar jika cepat', 'Benar bila murah', 'Gejala akan muncul kembali.', 'TRUE_FALSE'],
    ],
  },
]
