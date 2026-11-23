// Knowledge Hub news articles. They are illustrative case studies written for the demo (the numbers are examples, not company figures).
// {{img:key}} is replaced with the uploaded media id. author: employee number. days: how many days before 20 Oct 2026.
const note = '<p><em>Studi kasus ilustrasi untuk lingkungan demo SUGARLedge; angka bersifat contoh.</em></p>'

export const articles = [
  {
    key: 'kh-panas', category: 'Inovasi', author: 'PTSGN-1039', days: 3, motif: 'gear', hue: 24, tags: ['energi', 'evaporator', 'inovasi'], competencies: ['Pemeliharaan Mesin Pabrik'],
    title: 'Memanfaatkan Panas Buangan untuk Memanaskan Nira: Gagasan dari Bengkel Teknik',
    summary: 'Tim teknik mengusulkan penukar panas sederhana untuk mengambil kembali panas kondensat yang selama ini terbuang.',
    html: `<p>Setiap musim giling, kondensat panas dari stasiun penguapan dialirkan ke penampungan dan sebagian terbuang bersama uap flash. Tim teknik sebuah pabrik di Jawa Timur mengajukan pertanyaan sederhana: <strong>bisakah panas itu dipakai lagi untuk memanaskan nira mentah?</strong></p>
<h2>Gagasan</h2>
<p>Penukar panas pelat dipasang antara jalur kondensat dan jalur nira mentah sebelum pemanas pertama. Dengan begitu, nira masuk pemanas utama dalam suhu lebih tinggi sehingga kebutuhan uap pemanas berkurang.</p>
<figure><img data-media-id="{{img:kh-panas-1}}" alt="Ilustrasi penukar panas pelat pada jalur kondensat"><figcaption>Ilustrasi penukar panas pelat di jalur kondensat (gambar ilustrasi).</figcaption></figure>
<h2>Hasil uji awal</h2>
<ul><li>Suhu nira masuk pemanas utama naik sekitar 8 sampai 10 derajat Celsius pada uji dua minggu.</li><li>Konsumsi uap pemanas turun kira-kira dua persen terhadap nira.</li><li>Tidak ada perubahan pada kejernihan nira jernih.</li></ul>
<blockquote>Yang kami butuhkan bukan alat baru, melainkan keberanian memeriksa ke mana panas itu pergi.</blockquote>
<h2>Langkah berikutnya</h2>
<p>Tim akan membuat perhitungan keekonomian, merencanakan pembersihan pelat berkala, dan mengajukan usulan ini sebagai proyek perbaikan pada musim giling berikutnya.</p>${note}`,
  },
  {
    key: 'kh-analisa', category: 'Literasi', author: 'PTSGN-1038', days: 6, motif: 'lab', hue: 170, tags: ['laboratorium', 'brix', 'pol'], competencies: ['Analisa Mutu Nira'],
    title: 'Membaca Laporan Analisa Nira: Lima Angka yang Perlu Anda Hafal',
    summary: 'Brix, Pol, HK, nilai nira, dan pol ampas. Cara membacanya tanpa harus menjadi analis laboratorium.',
    html: `<p>Laporan analisa laboratorium sering dikirim ke banyak orang, tetapi tidak semua orang yakin cara membacanya. Berikut lima angka yang paling sering dipakai pada rapat pagi.</p>
<h2>1. Brix</h2>
<p>Persentase zat padat terlarut. Pada nira perahan pertama nilainya menggambarkan seberapa manis tebu yang digiling.</p>
<h2>2. Pol</h2>
<p>Persentase sukrosa. Selisih Brix dan Pol menunjukkan zat bukan gula yang ikut larut.</p>
<h2>3. Harkat kemurnian (HK)</h2>
<p>Pol dibagi Brix dikali 100. HK nira mentah yang rendah memberi sinyal tebu bermasalah atau pemerahan tidak optimal.</p>
<h2>4. Nilai nira</h2>
<p>Dihitung dari Pol dan Brix; dipakai menentukan rendemen. Inilah angka yang akhirnya sampai ke petani.</p>
<h2>5. Pol ampas</h2>
<p>Sukrosa yang terbawa ampas. Kenaikan mendadak berarti ada gula yang tidak terperah di gilingan.</p>
<table><thead><tr><th>Angka</th><th>Apa yang ditunjukkan</th></tr></thead><tbody><tr><td>Brix NPP</td><td>Kemanisan tebu</td></tr><tr><td>HK nira mentah</td><td>Kemurnian dan kerja gilingan</td></tr><tr><td>Pol ampas</td><td>Kehilangan di gilingan</td></tr></tbody></table>${note}`,
  },
  {
    key: 'kh-polampas', category: 'Best Practice', author: 'PTSGN-1037', days: 9, motif: 'factory', hue: 205, tags: ['gilingan', 'pol ampas', 'shift'], competencies: ['Pengoperasian Stasiun Gilingan'],
    title: 'Lima Kebiasaan Shift untuk Menekan Pol Ampas',
    summary: 'Praktik sederhana yang dilakukan pengawas gilingan di awal dan tengah shift.',
    html: `<p>Pol ampas jarang turun karena satu perbaikan besar. Biasanya ia turun karena sekelompok kebiasaan kecil yang dijalankan konsisten setiap shift.</p>
<ol><li><strong>Periksa setelan di awal shift.</strong> Celah rol dan tekanan hidrolik dicocokkan dengan beban tebu hari itu.</li><li><strong>Pastikan pisau dan unigrator tajam.</strong> Tebu yang tercacah baik lebih mudah diperah.</li><li><strong>Atur imbibisi per gilingan,</strong> bukan hanya totalnya.</li><li><strong>Baca tren jam-jaman.</strong> Tiga kenaikan berturut-turut cukup alasan untuk memeriksa lapangan.</li><li><strong>Catat dan serahkan.</strong> Catatan serah terima shift mencantumkan setelan yang diubah dan alasannya.</li></ol>
<figure><img data-media-id="{{img:kh-polampas-1}}" alt="Papan kendali stasiun gilingan"><figcaption>Papan tren jam-jaman membantu pengawas melihat pola sebelum angka melewati batas (ilustrasi).</figcaption></figure>
<p>Kebiasaan ini tidak membutuhkan anggaran, hanya disiplin dan komunikasi antar-shift.</p>${note}`,
  },
  {
    key: 'kh-henti', category: 'Problem Solving', author: 'PTSGN-1028', days: 13, motif: 'magnify', hue: 225, tags: ['5 whys', 'henti mesin', 'konveyor'], competencies: ['Analisis Data dan Pemecahan Masalah'],
    title: 'Menelusuri Henti Mesin Berulang dengan 5 Whys: Kasus Konveyor Ampas',
    summary: 'Konveyor ampas berhenti tiga kali dalam seminggu. Lima pertanyaan "mengapa" membawa tim ke penyebab yang berbeda dari dugaan awal.',
    html: `<p>Konveyor ampas berhenti tiga kali dalam satu minggu. Dugaan pertama: motor penggerak terlalu lemah. Tim memutuskan menelusuri dengan <strong>5 Whys</strong> sebelum mengganti apa pun.</p>
<ol><li>Mengapa konveyor berhenti? <em>Karena pengaman beban lebih bekerja.</em></li><li>Mengapa beban berlebih? <em>Karena ampas menumpuk di titik sambung.</em></li><li>Mengapa menumpuk? <em>Karena sambungan sempit dan sudut curam.</em></li><li>Mengapa sempit? <em>Karena modifikasi dua musim lalu tidak menyertakan perhitungan kapasitas.</em></li><li>Mengapa tidak ada perhitungan? <em>Karena tidak ada daftar periksa perubahan teknik.</em></li></ol>
<h2>Tindakan</h2>
<p>Bukan mengganti motor, melainkan melebarkan sambungan dan menambahkan daftar periksa perubahan teknik. Henti mesin tercatat nol pada tiga minggu berikutnya.</p>
<blockquote>Penyebab yang terlihat hampir selalu bukan penyebab yang paling dalam.</blockquote>${note}`,
  },
  {
    key: 'kh-pldp', category: 'Best Practice', author: 'PTSGN-1035', days: 16, motif: 'heart', hue: 340, tags: ['kepemimpinan', 'misi mingguan', 'pldp'], competencies: [],
    title: 'Catatan Peserta PLDP: Belajar Memimpin Lewat Misi Mingguan',
    summary: 'Seorang peserta Program Pengembangan Pemimpin berbagi cara menerjemahkan target besar menjadi misi kecil yang bisa dituntaskan tim dalam seminggu.',
    html: `<p>Salah satu pelajaran terbesar dari program pengembangan pemimpin bukan teori, melainkan kebiasaan: <strong>memecah target besar menjadi misi mingguan</strong>.</p>
<h2>Contoh</h2>
<p>Target "menaikkan recovery" terlalu luas untuk dipegang tim shift. Menjadi "menurunkan pol ampas pada gilingan tiga selama tujuh hari" misi itu dapat dipahami, diukur, dan dirayakan.</p>
<h2>Tiga aturan misi</h2>
<ul><li>Satu misi, satu pemilik.</li><li>Ada angka awal dan angka target.</li><li>Ditinjau setiap Jumat selama lima belas menit.</li></ul>
<p>Peserta mengaku hasil terbesar justru pada <em>percakapan</em>: tim lebih sering bertanya sebelum menyalahkan.</p>${note}`,
  },
  {
    key: 'kh-jeda', category: 'Karya Tulis', author: 'PTSGN-1041', days: 21, motif: 'cane', hue: 120, tags: ['tebang giling', 'rendemen', 'karya tulis'], competencies: ['Budidaya dan Tebang Muat Angkut'],
    title: 'Karya Tulis: Pengaruh Jeda Tebang-Giling terhadap Rendemen',
    summary: 'Ringkasan karya tulis yang membandingkan rendemen tebu giling berdasarkan lama jeda antara tebang dan giling.',
    html: `<p>Karya tulis ini membandingkan tebu yang digiling dalam rentang jeda berbeda setelah tebang, untuk melihat apakah aturan "segar" benar-benar terasa pada angka rendemen.</p>
<h2>Metode</h2>
<p>Sampel dikelompokkan berdasarkan jeda tebang-giling: kurang dari 24 jam, 24 sampai 36 jam, dan lebih dari 36 jam. Setiap kelompok dianalisa Brix, Pol, dan HK.</p>
<h2>Temuan ringkas (contoh)</h2>
<table><thead><tr><th>Jeda</th><th>HK nira</th><th>Catatan</th></tr></thead><tbody><tr><td>Kurang dari 24 jam</td><td>Tertinggi</td><td>Mutu terjaga</td></tr><tr><td>24 sampai 36 jam</td><td>Menurun ringan</td><td>Masih dalam batas</td></tr><tr><td>Lebih dari 36 jam</td><td>Menurun nyata</td><td>Sukrosa terurai</td></tr></tbody></table>
<h2>Rekomendasi</h2>
<p>Sinkronkan jadwal tebang dengan kapasitas giling harian, dan prioritaskan pengangkutan tebu yang sudah lama menunggu.</p>${note}`,
  },
  {
    key: 'kh-ckp', category: 'Project Assignment CKP', author: 'PTSGN-1036', days: 26, motif: 'check', hue: 250, tags: ['gugus kendali mutu', 'tebu kotor', 'emplasemen'], competencies: ['Analisis Data dan Pemecahan Masalah'],
    title: 'Gugus Kendali Mutu: Mengurangi Tebu Kotor di Emplasemen',
    summary: 'Gugus lintas bagian menurunkan kadar kotoran tebu lewat pemilahan di kebun dan umpan balik harian ke mandor tebang.',
    html: `<p>Kadar kotoran tebu yang tinggi menurunkan rendemen dan memperberat pemurnian. Sebuah gugus kendali mutu beranggotakan bagian Tanaman, QA, dan Pengolahan mengambil masalah ini sebagai proyek.</p>
<h2>Langkah</h2>
<ol><li>Mengukur kadar kotoran per mandor tebang selama dua minggu.</li><li>Membuat diagram Pareto penyebab: pucuk, daduk, dan tanah.</li><li>Memberikan umpan balik harian ke mandor, bukan hanya laporan bulanan.</li></ol>
<figure><img data-media-id="{{img:kh-ckp-1}}" alt="Diagram Pareto penyebab tebu kotor"><figcaption>Diagram Pareto penyebab tebu kotor (ilustrasi).</figcaption></figure>
<h2>Hasil</h2>
<p>Kadar kotoran turun bertahap dalam enam minggu. Yang paling berpengaruh bukan sanksi, melainkan umpan balik cepat yang spesifik.</p>${note}`,
  },
  {
    key: 'kh-catat', category: 'Karya', author: 'PTSGN-1036', days: 33, motif: 'chart', hue: 45, tags: ['spreadsheet', 'sampel nira', 'karya'], competencies: ['Analisis Data dan Pemecahan Masalah'],
    title: 'Lembar Kerja Sederhana untuk Mencatat Sampel Nira',
    summary: 'Sebuah lembar kerja berbasis spreadsheet menggantikan buku catatan kertas dan memunculkan peringatan otomatis saat angka keluar batas.',
    html: `<p>Pencatatan sampel nira di banyak pos masih memakai buku kertas. Lembar kerja ini lahir dari kebutuhan sederhana: <strong>melihat tren tanpa menunggu rekap akhir shift</strong>.</p>
<h2>Isi lembar kerja</h2>
<ul><li>Input Brix dan Pol per titik sampel.</li><li>HK dihitung otomatis.</li><li>Sel berubah warna bila di luar batas yang ditetapkan QA.</li><li>Grafik tren jam-jaman muncul di halaman depan.</li></ul>
<p>Lembar kerja ini bukan pengganti sistem informasi laboratorium, tetapi jembatan sampai sistem itu tersedia.</p>${note}`,
  },
  {
    key: 'kh-k3musiman', category: 'Best Practice', author: 'PTSGN-1043', days: 40, motif: 'shield', hue: 8, tags: ['k3', 'tenaga musiman', 'orientasi'], competencies: ['Keselamatan dan Kesehatan Kerja'],
    title: 'Orientasi K3 Tiga Puluh Menit untuk Tenaga Musiman',
    summary: 'Sebelum giling dimulai, tenaga musiman mendapatkan orientasi singkat yang berfokus pada tiga bahaya paling sering.',
    html: `<p>Setiap musim giling membawa tenaga baru yang belum mengenal pabrik. Orientasi K3 yang terlalu panjang jarang diingat; orientasi yang terlalu singkat tidak cukup. Tim K3 memilih <strong>tiga puluh menit dengan tiga fokus</strong>.</p>
<h2>Tiga fokus</h2>
<ol><li><strong>Titik jepit.</strong> Dilihat langsung di lokasi, bukan di slide.</li><li><strong>Permukaan dan uap panas.</strong> Jalur aman dan tanda bahaya.</li><li><strong>Cara melapor.</strong> Siapa yang dihubungi dan bagaimana.</li></ol>
<p>Setiap peserta menerima kartu saku dan menandatangani daftar hadir. Pengawas melakukan pengecekan acak pada minggu pertama.</p>${note}`,
  },
  {
    key: 'kh-lp', category: 'Literasi', author: 'PTSGN-1034', days: 48, motif: 'path', hue: 205, tags: ['learning path', 'kompetensi', 'panduan'], competencies: [],
    title: 'Panduan Membaca Learning Path dan Peta Kompetensi Anda',
    summary: 'Cara memakai Learning Path, kompetensi, dan target jam belajar di SUGARLedge supaya pengembangan diri terarah.',
    html: `<p>SUGARLedge menampilkan tiga hal yang saling terkait: <strong>kompetensi</strong>, <strong>learning path</strong>, dan <strong>target belajar</strong>. Berikut cara membacanya.</p>
<h2>Kompetensi</h2>
<p>Daftar kemampuan yang diharapkan untuk jabatan Anda. Penilaian dilakukan atasan atau tim SDM.</p>
<h2>Learning path</h2>
<p>Urutan kursus yang dianjurkan. Kursus yang terkunci menunggu prasyarat; selesaikan kursus sebelumnya untuk membukanya.</p>
<h2>Target belajar</h2>
<p>Atur target jam pelajaran tahunan di halaman Preferensi. Kemajuan Anda tampil di Beranda.</p>
<p>Mulailah dari satu kursus pada jalur Anda, lalu lihat bagaimana kompetensi dan target Anda bergerak.</p>`,
  },
]
