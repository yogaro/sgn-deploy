// Writes seed/sql/30_lms.sql: the LMS demo data (courses, sessions, learners, evaluation, LNA, Knowledge Hub...).
// Deterministic (fixed seed) and meant to run after 00_reset_lms.sql, once the Directory/IAM people have synced into core.employees.
// "Today" in the demo is 2026-10-20. Run: node seed/gen/lms.mjs
// With --formasi the people are the real staff list (seed/gen/directory-formasi.mjs) and the demo starts clean: courses,
// sessions still to come, Knowledge Hub articles, learning paths and the PSDM pilot, but no history (no enrollments,
// scores, evaluations, proposals, credentials) tied to a real name. The made-up course owners and authors become the
// real L&D staff below.
import { readFileSync, writeFileSync } from 'node:fs'
import { elearning } from '../data/catalog.mjs'
import { articles } from '../data/knowledge.mjs'
import { onsite } from '../data/onsite.mjs'
import { extraAssignees, pilotUnits } from '../data/piloting.mjs'

const here = new URL('..', import.meta.url).pathname
const FORMASI = process.argv.includes('--formasi')
// People added after the demo history was written (`late`) take no part in it, so the history stays as it was.
const people = FORMASI ? [] : JSON.parse(readFileSync(`${here}data/people.json`, 'utf8')).filter((p) => !p.late)
// Real L&D staff (FORMASI) standing in for the made-up personas: the course owner and trainer, the admin who publishes,
// and the head of the division who signs.
const ld = { trainer: { employee_number: '11000188', name: 'DYAH YUNI ZAENARTIN', title: 'Kasubdiv Pendidikan & Pelatihan' }, admin: '18013619', kadiv: { employee_number: '18003356', name: 'DESTA RISDIYANTO' } }
// remap points every made-up number at the real L&D staff when the people are real.
const remap = (num) => (!FORMASI || !String(num).startsWith('PTSGN-') ? num : num === 'PTSGN-1035' || num === 'PTSGN-1036' ? ld.admin : ld.trainer.employee_number)
const media = JSON.parse(readFileSync(`${here}assets/media.json`, 'utf8'))
const TODAY = '2026-10-20'

// ---------- helpers ----------
let seed = 20261020
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
const between = (a, b) => a + Math.floor(rand() * (b - a + 1))
const pick = (a) => a[Math.floor(rand() * a.length)]
const chance = (p) => rand() < p
function shuffle(a) {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
  return r
}
class Raw { constructor(s) { this.s = s } }
const raw = (s) => new Raw(s)
const q = (v) => v instanceof Raw ? v.s : v == null ? 'NULL' : typeof v === 'number' ? String(v) : typeof v === 'boolean' ? (v ? 'true' : 'false') : `'${String(v).replace(/'/g, "''")}'`
const day = (s, n) => { const d = new Date(`${s}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const ts = (d, h = 9, m = 0) => `${d} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+07`
const minDate = (a, b) => (a < b ? a : b)
const addMonths = (s, n) => { const d = new Date(`${s}T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10) }
const E = (num) => raw(`(SELECT id FROM e WHERE num = ${q(remap(num))})`)
const out = []
const sequences = new Set()
function insert(table, cols, rows, { override = false } = {}) {
  if (!rows.length) return
  for (let i = 0; i < rows.length; i += 250) {
    const chunk = rows.slice(i, i + 250)
    out.push(`INSERT INTO ${table} (${cols.join(', ')})${override ? ' OVERRIDING SYSTEM VALUE' : ''} VALUES\n${chunk.map((r) => `(${r.map(q).join(', ')})`).join(',\n')};`)
  }
  if (override) sequences.add(table)
}
const byNum = new Map(people.map((p) => [p.employee_number, p]))
const byPos = new Map(people.map((p) => [p.position, p]))

// ---------- people roles and pools ----------
function roleOf(p) {
  const c = p.position
  let m
  if ((m = c.match(/^PTSGN-POS-(?:KADIV|KASUBDIV|STAF)-([A-Z0-9]+?)(?:-\d+)?$/))) return m[1]
  if (c.startsWith('PTSGN-POS-KB-')) return 'KB'
  if (c.endsWith('-HEAD')) return 'CLUSTER'
  if (c.endsWith('-GM')) return 'GM'
  if ((m = c.match(/^PTSGN-POS-[A-Z]{4}-(OLH|TAN|QA|TEK|AKU)-(?:MGR|AST)$/))) return m[1]
  if (c.startsWith('PTSGN-POS-DIR')) return 'DIR'
  return 'OTHER'
}
for (const p of people) p.role = roleOf(p)
const hoParent = { RENSTRA: 'PTSGN-POS-DIRUT', SEKPER: 'PTSGN-POS-DIRUT', KEUANGAN: 'PTSGN-POS-DIRKEUSDM', SDM: 'PTSGN-POS-DIRKEUSDM', TI: 'PTSGN-POS-DIRTEKOPS', OPSPROD: 'PTSGN-POS-DIRTEKOPS' }
function headOf(p) {
  let parent = p.parent
  if (!parent) {
    if (p.position.startsWith('PTSGN-POS-STAF-')) parent = `PTSGN-POS-KADIV-${p.role}`
    else if (p.position === 'PTSGN-POS-KASUBDIV-INFRATI') parent = 'PTSGN-POS-KADIV-TI'
    else if (p.position === 'PTSGN-POS-KASUBDIV-RENPROD') parent = 'PTSGN-POS-KADIV-OPSPROD'
    else parent = hoParent[p.role]
    if (p.position.startsWith('PTSGN-POS-STAF-INFRATI')) parent = 'PTSGN-POS-KASUBDIV-INFRATI'
    if (p.position.startsWith('PTSGN-POS-STAF-RENPROD')) parent = 'PTSGN-POS-KASUBDIV-RENPROD'
  }
  return byPos.get(parent) ?? null
}
const roles = (...r) => (p) => r.includes(p.role)
const pools = {
  teknik: roles('TEK', 'OLH', 'TEKPOL', 'OPSPROD', 'RENPROD'),
  k3: roles('K3L', 'TEK', 'OLH', 'QA', 'TAN'),
  pengolahan: roles('OLH', 'TEKPOL', 'OPSPROD', 'TEK', 'QA'),
  qa: roles('QA', 'OPSPROD'),
  tanaman: roles('TAN', 'TANAMAN', 'KB'),
  pengadaan: roles('PENGADAAN', 'AKU', 'KEUANGAN', 'TEK'),
  audit: roles('SPI', 'RISIKO', 'KEUANGAN', 'AKU'),
  risiko: roles('RISIKO', 'SPI', 'KEUANGAN', 'SEKPER', 'HUKUM'),
  hc: roles('SDM', 'PSDMB'),
  hukum: roles('HUKUM', 'SEKPER', 'KB'),
  strategis: roles('RENSTRA', 'SEKPER', 'PSDMB', 'CLUSTER'),
  it: roles('TI', 'INFRATI'),
  keuangan: roles('KEUANGAN', 'AKU'),
  lingkungan: roles('K3L', 'OLH', 'TEK', 'QA'),
  'manajer-pg': (p) => ['GM', 'OLH', 'TAN', 'KB', 'CLUSTER'].includes(p.role) || ['KADIV-TEKPOL', 'KADIV-TANAMAN', 'KADIV-OPSPROD'].some((s) => p.position.endsWith(s)),
}
const poolOf = (tag) => people.filter(pools[tag])

// ---------- setup ----------
out.push(`-- Generated by seed/gen/lms.mjs; do not edit by hand. Run after 00_reset_lms.sql.`, 'BEGIN;',
  'CREATE TEMP TABLE e AS SELECT employee_number AS num, id, position_id, unit_id FROM core.employees;',
  `DELETE FROM course.categories WHERE name IN ('test', 'K3 & Keselamatan', 'Pengembangan Diri', 'Operasional & Mutu');`)
const catId = (name) => raw(`(SELECT id FROM course.categories WHERE name = ${q(name)})`)
const khCat = (name) => raw(`(SELECT id FROM kh.categories WHERE name = ${q(name)})`)
const admin = 'PTSGN-1035' // L&D staff with LMS_ADMIN
const kasubdiv = FORMASI ? ld.trainer : byNum.get('PTSGN-1034')
const kadivSdm = FORMASI ? ld.kadiv : byNum.get('PTSGN-1011')
const signerTitle = FORMASI ? ld.trainer.title : 'Kepala Sub Divisi Pengembangan SDM dan Budaya'
out.push(`UPDATE cert.settings SET signer_name = ${q(kasubdiv.name)}, signer_title = ${q(signerTitle)}, updated_at = now();`)

// ---------- competencies ----------
const competencyDefs = [
  ['Pengetahuan Proses Pabrik Gula', 'HARD', 'Memahami alur, tujuan, dan keterkaitan stasiun pengolahan tebu menjadi gula.'],
  ['Analisa Mutu Nira', 'HARD', 'Mengambil sampel dan membaca analisa Brix, Pol, HK serta menindaklanjuti penyimpangan.'],
  ['Pengoperasian Stasiun Gilingan', 'HARD', 'Mengawasi dan menyetel gilingan untuk ekstraksi optimal dan aman.'],
  ['Pemeliharaan Mesin Pabrik', 'HARD', 'Merencanakan dan menjalankan pemeliharaan preventif dan prediktif peralatan pabrik.'],
  ['Budidaya dan Tebang Muat Angkut', 'HARD', 'Menerapkan budidaya tebu dan kriteria tebang Manis, Bersih, Segar.'],
  ['Keselamatan dan Kesehatan Kerja', 'HARD', 'Mengenali bahaya, menerapkan hierarki pengendalian, dan memenuhi persyaratan K3.'],
  ['Sistem Manajemen Lingkungan', 'HARD', 'Memahami aspek dan dampak lingkungan serta kewajiban kepatuhan.'],
  ['Audit Mutu dan Rantai Pasok', 'HARD', 'Menilai pemasok dan proses berdasarkan persyaratan sistem manajemen mutu.'],
  ['Audit Internal', 'HARD', 'Merencanakan, melaksanakan, dan melaporkan audit internal sesuai standar profesi.'],
  ['Pengendalian Internal Pelaporan Keuangan', 'HARD', 'Menguji desain dan efektivitas kontrol atas pelaporan keuangan.'],
  ['Pengadaan Barang dan Jasa', 'HARD', 'Menyusun spesifikasi dan HPS serta menjalankan proses pengadaan sesuai pedoman.'],
  ['Analisis Data dan Pemecahan Masalah', 'HARD', 'Menganalisis data, menyajikannya, dan menemukan akar masalah.'],
  ['Pengelolaan Pengembangan SDM', 'HARD', 'Merancang dan mengelola program pembelajaran dan kompetensi.'],
  ['Pengelolaan Aset', 'HARD', 'Mengelola legalitas dan pemanfaatan aset tanah dan bangunan.'],
  ['Perencanaan Strategis', 'HARD', 'Menyusun dan mengawal rencana jangka panjang dan program prioritas.'],
  ['Keamanan Informasi', 'HARD', 'Menjaga kerahasiaan, integritas, dan ketersediaan informasi.'],
  ['Akuntansi dan Pelaporan Keuangan', 'HARD', 'Menyusun dan menelaah laporan keuangan sesuai standar.'],
  ['Nilai AKHLAK', 'SOFT', 'Mewujudkan nilai Amanah, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif dalam pekerjaan.'],
  ['Kepemimpinan dan Pengambilan Keputusan', 'SOFT', 'Mengarahkan tim, menetapkan prioritas, dan memutuskan berbasis data.'],
  ['Komunikasi dan Kolaborasi', 'SOFT', 'Berkomunikasi jelas dan bekerja lintas fungsi.'],
  ['Inovasi dan Adaptasi', 'SOFT', 'Mengusulkan perbaikan dan menyesuaikan diri dengan perubahan.'],
  ['Integritas dan Etika Kerja', 'SOFT', 'Menjaga kejujuran, menghindari benturan kepentingan, dan menolak gratifikasi.'],
]
const compId = new Map(competencyDefs.map((c, i) => [c[0], i + 1]))
insert('comp.competencies', ['id', 'name', 'kind', 'definition', 'sort_order', 'is_active', 'is_sample'], competencyDefs.map((c, i) => [i + 1, c[0], c[1], c[2], i + 1, true, false]), { override: true })

// ---------- courses ----------
const courses = []
let courseSeq = 0, sectionSeq = 0, lessonSeq = 0, questionSeq = 0, optionSeq = 0
const rows = { courses: [], versions: [], trainers: [], sections: [], lessons: [], questions: [], options: [], cc: [] }
function addCourse(def) {
  const id = ++courseSeq
  const c = { id, versionId: id, publishedAt: def.publishedAt, code: def.code, title: def.title, lessons: [], method: def.method ?? 'E_LEARNING', hours: def.hours, certMonths: def.certMonths ?? null, cost: def.cost ?? null, owner: def.owner, category: def.category, hasCert: def.hasCert ?? true, required: Boolean(def.required), questions: new Map() }
  rows.courses.push([id, def.code, E(def.owner), false, ts(def.publishedAt, 9)])
  rows.versions.push([id, id, 1, def.status ?? 'PUBLISHED', def.title, def.summary, def.description ?? def.summary, def.goals ?? '- Memahami konsep dan praktik utama topik ini.\n- Menerapkannya pada pekerjaan sehari-hari.',
    catId(def.category), def.cover ? raw(`${media[def.cover].id}`) : null, true, Boolean(def.sequential), c.hasCert, c.certMonths, def.hours * 60, def.reviewNotes ?? null, def.status === 'DRAFT' ? null : E(def.owner),
    def.status === 'DRAFT' ? null : ts(def.publishedAt, 8), def.status && def.status !== 'PUBLISHED' ? null : ts(def.publishedAt, 10), def.status && def.status !== 'PUBLISHED' ? null : E(admin), ts(def.publishedAt, 8), ts(def.publishedAt, 10),
    c.method, def.hours, c.cost, def.behavior?.[0] ?? null, def.behavior?.[1] ?? null])
  rows.trainers.push([id, E(def.owner)])
  for (const name of def.competencies ?? []) { if (!compId.has(name)) throw new Error(`unknown competency ${name}`); rows.cc.push([id, compId.get(name)]) }
  courses.push(c)
  return c
}
function addSection(c, title, position) {
  const id = ++sectionSeq
  rows.sections.push([id, c.versionId, title, position])
  return id
}
function addLesson(c, section, position, def) {
  const id = ++lessonSeq
  rows.lessons.push([id, section, position, def.kind, def.title, true, def.media ?? null, null, def.body ?? null, false, def.pass ?? null, def.maxAttempts ?? null, def.timeLimit ?? null, def.count ?? null, true, def.review ?? false, def.role ?? null])
  const l = { id, kind: def.kind, role: def.role ?? null, duration: def.duration ?? 0, pass: def.pass ?? null }
  c.lessons.push(l)
  return l
}
function addQuestions(c, lesson, qs) {
  const list = []
  for (const [i, item] of qs.entries()) {
    const [prompt, correct, w1, w2, w3, explanation, kind = 'SINGLE'] = item
    const qid = ++questionSeq
    rows.questions.push([qid, lesson.id, kind, prompt, explanation, i + 1])
    let opts
    if (kind === 'MULTIPLE') {
      const good = correct.split('|'), bad = w1.split('|')
      opts = [...good.map((t) => [t, true]), ...bad.map((t) => [t, false])]
    } else if (kind === 'TRUE_FALSE') {
      opts = [['Benar', correct === 'Benar'], ['Salah', correct === 'Salah']]
    } else {
      opts = [[correct, true], [w1, false], [w2, false], [w3, false]]
    }
    const ordered = kind === 'TRUE_FALSE' ? opts : shuffle(opts)
    const ids = []
    ordered.forEach(([label, ok], j) => {
      const oid = ++optionSeq
      rows.options.push([oid, qid, label, ok, j + 1])
      ids.push({ id: oid, ok })
    })
    list.push({ id: qid, options: ids })
  }
  lesson.bank = list
}

// e-learning courses
const startPublish = '2026-01-12'
elearning.forEach((def, i) => {
  const publishedAt = day(startPublish, i * 21)
  const c = addCourse({ ...def, method: 'E_LEARNING', cost: null, publishedAt, cover: `cover-${def.code}`, sequential: ['K3-101', 'PGS-103'].includes(def.code) })
  const s1 = addSection(c, 'Pengantar', 1), s2 = addSection(c, 'Materi', 2), s3 = addSection(c, 'Evaluasi', 3)
  const pre = addLesson(c, s1, 1, { kind: 'QUIZ', title: 'Pre-test', role: 'PRE', pass: 1, maxAttempts: 1, timeLimit: 10, count: 5 })
  const vid = media[`video-${def.code}`]
  addLesson(c, s1, 2, { kind: 'VIDEO', title: `Video: ${def.slides[0][0]}`, media: vid.id, duration: vid.duration })
  addLesson(c, s2, 1, { kind: 'ARTICLE', title: 'Bahan bacaan', body: def.article })
  addLesson(c, s2, 2, { kind: 'DOCUMENT', title: 'Ringkasan materi (PDF)', media: media[`handout-${def.code}`].id })
  const post = addLesson(c, s3, 1, { kind: 'QUIZ', title: 'Post-test', role: 'POST', pass: 70, maxAttempts: 3, timeLimit: 15, count: 5, review: true })
  addQuestions(c, pre, def.questions)
  addQuestions(c, post, def.questions)
  c.def = def
})

// extra courses in the authoring queue
const draftA = addCourse({ code: 'PGS-104', title: 'Dasar Pengoperasian Ketel Uap', category: 'Tekpol', owner: 'PTSGN-1039', hours: 5, publishedAt: '2026-10-12', status: 'DRAFT', summary: 'Prinsip kerja ketel uap, parameter yang dipantau, dan batas aman operasi.', cover: null, competencies: ['Pemeliharaan Mesin Pabrik', 'Keselamatan dan Kesehatan Kerja'] })
{
  const s = addSection(draftA, 'Materi', 1)
  addLesson(draftA, s, 1, { kind: 'ARTICLE', title: 'Prinsip kerja ketel uap', body: '## Prinsip kerja\n\nKetel mengubah air menjadi uap bertekanan dengan memanfaatkan panas pembakaran ampas. Operator memantau tekanan, level air, dan suhu uap.\n\n*Naskah masih disusun.*' })
}
const draftB = addCourse({ code: 'PGS-105', title: 'Analisis Kehilangan Gula dalam Proses (Sugar Loss)', category: 'Quality Assurance', owner: 'PTSGN-1038', hours: 6, publishedAt: '2026-10-18', status: 'IN_REVIEW', summary: 'Menelusuri kehilangan gula di ampas, blotong, tetes, dan kehilangan tak tertentukan.', cover: null, competencies: ['Analisa Mutu Nira'] })
{
  const s1 = addSection(draftB, 'Materi', 1), s2 = addSection(draftB, 'Evaluasi', 2)
  addLesson(draftB, s1, 1, { kind: 'ARTICLE', title: 'Neraca gula pabrik', body: '## Neraca gula\n\nKehilangan gula dihitung sebagai selisih sukrosa masuk dengan sukrosa pada gula produk. Kehilangan dipecah menjadi ampas, blotong, tetes, dan *undetermined loss*.' })
  const post = addLesson(draftB, s2, 1, { kind: 'QUIZ', title: 'Post-test', role: 'POST', pass: 70, maxAttempts: 3, timeLimit: 10, count: 3 })
  addQuestions(draftB, post, [
    ['Kehilangan gula di ampas diukur dari…', 'Pol ampas', 'Brix tetes', 'Kadar air gula', 'pH nira', 'Pol ampas menunjukkan sukrosa yang tidak terperah.'],
    ['Undetermined loss adalah…', 'Kehilangan yang tidak dapat dijelaskan oleh pengukuran', 'Kehilangan di tetes', 'Kehilangan di kemasan', 'Selisih harga', 'Muncul dari selisih neraca.'],
    ['Tetes termasuk kehilangan yang…', 'Tercatat pada neraca', 'Tidak pernah dihitung', 'Dibuang ke sungai', 'Sama dengan ampas', 'Tetes memiliki Pol yang terukur.'],
    ['Benar atau salah: neraca gula membantu menemukan stasiun dengan kehilangan terbesar.', 'Benar', 'Salah', 'Salah', 'Salah', 'Neraca menunjuk lokasi kehilangan.', 'TRUE_FALSE'],
  ])
}
const sessionsRows = []
const attendeeRows = []
const enrollments = []
const enrollmentIndex = new Map()
const instructors = { 'K3': 'Lembaga pelatihan K3 mitra (berizin Kemnaker)', LNG: 'Lembaga sertifikasi bidang lingkungan mitra', PRC: 'Praktisi pengadaan dan pembina SGN', OPS: 'Tim pembina Divisi Teknik dan Pengolahan SGN', AUD: 'Tim SPI SGN dan lembaga profesi mitra', HC: 'Tim Pengembangan SDM dan Budaya SGN dan mitra' }
const instructorFor = (code) => instructors[code.slice(0, 3)] ?? instructors[code.slice(0, 2)] ?? 'Tim Learning & Development SGN'

// onsite and blended courses
let sessionSeq = 0
const todayStr = TODAY
onsite.forEach((def, i) => {
  const firstStart = def.s.map((s) => s[1]).sort()[0]
  const publishedAt = day(firstStart, -45 - (i % 5) * 3)
  const hasCert = def.hours >= 8 || def.certMonths != null
  const c = addCourse({ ...def, publishedAt, hasCert, cover: `cover-${def.code}`, goals: `- Mengikuti seluruh sesi ${def.title.toLowerCase().slice(0, 60)}.\n- Menerapkan hasilnya pada pekerjaan unit kerja.`, description: undefined })
  c.pool = def.pool
  c.def = def
  if (def.method === 'BLENDED') {
    const s = addSection(c, 'Persiapan peserta', 1)
    addLesson(c, s, 1, { kind: 'ARTICLE', title: 'Panduan peserta', body: `## Sebelum mengikuti sesi\n\nBaca ringkasan tujuan dan jadwal pada halaman kursus, siapkan pertanyaan dari pekerjaan Anda, dan konfirmasi kehadiran ke atasan langsung.\n\nSesi tatap muka dicatat kehadirannya oleh penyelenggara; kursus dinyatakan selesai setelah Anda hadir.` })
  }
  for (const [name, start, end, location, n, cap] of def.s) {
    const past = end < todayStr
    if (FORMASI && past) continue
    const sid = ++sessionSeq
    sessionsRows.push([sid, c.id, name, ts(start, 8), ts(end, 16), location, instructorFor(def.code), cap, null, 'SCHEDULED', null, E(admin), ts(day(start, -30), 10), ts(day(start, -30), 10), def.cost || null])
    c.sessionList = c.sessionList ?? []
    c.sessionList.push({ id: sid, name, start, end, n, cap, past })
  }
})

// ---------- enrollments ----------
let enrSeq = 0
function enrollRow(e) {
  enrollments.push(e)
  enrollmentIndex.set(`${e.emp}|${e.course.id}`, e)
  return e
}
function addEnrollment({ emp, course, source, required = false, due = null, status, pct, enrolledAt, startedAt = null, completedAt = null, lastLesson = null }) {
  const key = `${emp}|${course.id}`
  if (enrollmentIndex.has(key)) return enrollmentIndex.get(key)
  return enrollRow({ id: ++enrSeq, emp, course, source, required, due, status, pct, enrolledAt, startedAt, completedAt, lastLesson })
}

const assignmentDefs = FORMASI ? [] : [
  { code: 'K3-101', title: 'Dasar K3 Pabrik Gula untuk seluruh karyawan', due: { kind: 'FIXED', date: '2026-11-30' }, created: '2026-09-01', units: ['PTSGN-DIR-UTAMA', 'PTSGN-DIR-KEUSDM', 'PTSGN-DIR-TEKOPS'], everyone: true },
  { code: 'CUL-101', title: 'AKHLAK dan Kode Etik 2026', due: { kind: 'FIXED', date: '2026-09-30' }, created: '2026-07-15', units: ['PTSGN-DIR-UTAMA', 'PTSGN-DIR-KEUSDM', 'PTSGN-DIR-TEKOPS'], everyone: true },
  { code: 'SM-101', title: 'Awareness ISO 14001 bagi unit teknik dan pengolahan', due: { kind: 'FIXED', date: '2026-10-27' }, created: '2026-09-15', units: ['PTSGN-DIV-K3L', 'PTSGN-DIV-TEKPOL', 'PTSGN-DIV-OPSPROD', 'PTSGN-PG-GLEN', 'PTSGN-PG-DJAT', 'PTSGN-PG-SRAG', 'PTSGN-PG-REND', 'PTSGN-PG-MOJO', 'PTSGN-PG-PEBA', 'PTSGN-PG-CIMA', 'PTSGN-PG-BUMA'], pool: (p) => ['K3L', 'TEKPOL', 'OPSPROD', 'OLH', 'TEK', 'QA'].includes(p.role) },
  { code: 'AUD-101', title: 'Dasar-dasar Audit bagi staf SPI dan Manajemen Risiko', due: { kind: 'RELATIVE', days: 90 }, created: '2026-08-03', units: ['PTSGN-DIV-SPI', 'PTSGN-DIV-RISIKO'], pool: (p) => ['SPI', 'RISIKO'].includes(p.role) },
]
const courseByCode = new Map(courses.map((c) => [c.code, c]))
const assignmentRows = [], targetRows = [], jobRows = [], enrAssignRows = []
assignmentDefs.forEach((a, i) => {
  const id = i + 1
  a.id = id
  a.course = courseByCode.get(a.code)
  assignmentRows.push([id, a.course.id, a.title, true, a.due.kind, a.due.date ?? null, a.due.days ?? null, true, E(admin), ts(a.created, 10)])
  for (const u of a.units) targetRows.push([id, 'UNIT', raw(`(SELECT id FROM core.org_units WHERE code = ${q(u)})`), true])
})

// outcome for one learner: returns {status, pct, enrolledAt, startedAt, completedAt}
function outcome(c, { required, due, created, mode }) {
  const lessonsN = c.lessons.length
  const r = rand()
  const enrolledAt = required ? created : day(c.publishedAt ?? '2026-02-01', between(3, 120))
  let status, k
  const overdue = required && due && due < todayStr
  const pDone = mode === 'done-heavy' ? 0.72 : required ? 0.6 : 0.46
  if (r < pDone) { status = 'COMPLETED'; k = lessonsN }
  else if (r < pDone + (overdue ? 0.12 : 0.28)) { status = 'ACTIVE'; k = between(1, lessonsN - 1) }
  else { status = 'ACTIVE'; k = 0 }
  const enrolled = enrolledAt > todayStr ? todayStr : enrolledAt
  const gap = k === 0 ? 0 : between(2, 28)
  const startedAt = k > 0 ? minDate(day(enrolled, between(0, 6)), day(todayStr, -1)) : null
  const completedAt = status === 'COMPLETED' ? minDate(day(startedAt, gap), day(todayStr, -1)) : null
  return { status, k, pct: Math.round((k / lessonsN) * 100), enrolledAt: enrolled, startedAt, completedAt }
}
function cohortFor(def) {
  const tag = def.cohort
  if (tag === 'all') return people
  if (typeof tag === 'function') return people.filter(tag)
  return shuffle(poolOf(tag)).slice(0, def.size)
}

const elCohorts = {
  'PGS-101': { cohort: 'pengolahan', size: 22, extra: (p) => ['OLH', 'TEKPOL', 'OPSPROD', 'QA'].includes(p.role) },
  'PGS-102': { cohort: 'qa', size: 14 },
  'PGS-103': { cohort: 'pengolahan', size: 16 },
  'TAN-101': { cohort: 'tanaman', size: 14 },
  'SM-102': { cohort: 'qa', size: 10 },
  'AUD-102': { cohort: 'audit', size: 9 },
  'PRC-101': { cohort: 'pengadaan', size: 16 },
  'DAT-101': { cohort: 'it', size: 8 },
}
const elearningCourses = courses.filter((c) => c.def?.questions && c.method === 'E_LEARNING' && c.def.code)
for (const c of elearningCourses) {
  const a = assignmentDefs.find((x) => x.code === c.code)
  let list
  if (a) {
    list = a.everyone ? people : people.filter(a.pool)
  } else {
    const cfg = elCohorts[c.code]
    list = cfg ? (cfg.extra ? shuffle(people.filter(cfg.extra)).slice(0, cfg.size) : shuffle(poolOf(cfg.cohort)).slice(0, cfg.size)) : []
    if (c.code === 'DAT-101') list = [...list, ...shuffle(poolOf('hc')).slice(0, 5), ...shuffle(poolOf('strategis')).slice(0, 4)]
  }
  for (const p of list) {
    if (a && !a.everyone && !a.pool(p)) continue
    const dueDate = a ? (a.due.date ?? day(a.created, a.due.days)) : null
    const o = outcome(c, { required: Boolean(a), due: dueDate, created: a?.created, mode: a?.code === 'CUL-101' ? 'done-heavy' : undefined })
    const e = addEnrollment({ emp: p.employee_number, course: c, source: a ? 'ASSIGNMENT' : 'SELF', required: Boolean(a), due: dueDate, status: o.status, pct: o.pct, enrolledAt: o.enrolledAt, startedAt: o.startedAt, completedAt: o.completedAt })
    e.k = o.k
    if (a) e.assignmentId = a.id
  }
  if (a) jobRows.push([a.id, E(admin), 'DONE', enrollments.filter((e) => e.assignmentId === a.id).length, 0, ts(a.created, 10), ts(a.created, 10), ts(a.created, 10)])
}

// onsite enrollments and attendance
for (const c of courses.filter((x) => x.sessionList)) {
  const pool = shuffle(poolOf(c.pool))
  const seen = []
  for (const s of c.sessionList) {
    const followUp = /remidi|Tahap|Wisuda|hasil widyakarya|Ujian/i.test(s.name) && seen.length > 0
    let list
    const n = s.n === 0 ? Math.max(4, Math.min(14, Math.round(s.cap * 0.35))) : s.n
    if (followUp) list = shuffle(seen).slice(0, Math.min(n, seen.length))
    else list = pool.filter((p) => !enrollmentIndex.has(`${p.employee_number}|${c.id}`)).slice(0, n)
    for (const p of list) {
      const present = s.past ? chance(0.93) : null
      let e = enrollmentIndex.get(`${p.employee_number}|${c.id}`)
      if (!e) {
        const enrolledAt = day(s.start, -between(10, 25))
        e = addEnrollment({ emp: p.employee_number, course: c, source: 'ASSIGNMENT', required: false, due: null, status: present ? 'COMPLETED' : 'ACTIVE', pct: present ? 100 : 0, enrolledAt, startedAt: present ? s.start : null, completedAt: present ? s.end : null })
        e.k = present ? c.lessons.length : 0
        e.sessionEnd = s.end
        seen.push(p)
      } else if (present && e.status !== 'COMPLETED') {
        Object.assign(e, { status: 'COMPLETED', pct: 100, startedAt: e.startedAt ?? s.start, completedAt: s.end, k: c.lessons.length, sessionEnd: s.end })
      }
      attendeeRows.push([s.id, E(p.employee_number), raw(`${e.id}`), s.past ? (present ? 'PRESENT' : 'ABSENT') : null, s.past ? E(admin) : null, s.past ? ts(s.end, 16, 30) : null, ts(day(s.start, -14), 11)])
    }
  }
}

// ---------- write courses ----------
insert('course.courses', ['id', 'code', 'owner_id', 'is_archived', 'created_at'], rows.courses, { override: true })
insert('course.versions', ['id', 'course_id', 'version_no', 'status', 'title', 'summary', 'description_md', 'objectives_md', 'category_id', 'cover_media_id', 'is_open', 'sequential', 'has_certificate', 'certificate_valid_months', 'estimated_minutes', 'review_notes', 'submitted_by', 'submitted_at', 'published_at', 'published_by', 'created_at', 'updated_at', 'delivery_method', 'learning_hours', 'cost_per_participant', 'behavior_target_1', 'behavior_target_2'], rows.versions, { override: true })
insert('course.course_trainers', ['course_id', 'employee_id'], rows.trainers)
insert('course.sections', ['id', 'version_id', 'title', 'position'], rows.sections, { override: true })
insert('course.lessons', ['id', 'section_id', 'position', 'kind', 'title', 'is_required', 'media_id', 'subtitle_media_id', 'body_md', 'allow_download', 'pass_score', 'max_attempts', 'time_limit_min', 'question_count', 'shuffle', 'show_review', 'quiz_role'], rows.lessons, { override: true })
insert('course.questions', ['id', 'lesson_id', 'kind', 'prompt_md', 'explanation_md', 'position'], rows.questions, { override: true })
insert('course.options', ['id', 'question_id', 'label_md', 'is_correct', 'position'], rows.options, { override: true })
insert('comp.course_competencies', ['course_id', 'competency_id'], rows.cc)
insert('onsite.sessions', ['id', 'course_id', 'name', 'starts_at', 'ends_at', 'location', 'instructor', 'capacity', 'notes', 'status', 'cancelled_at', 'created_by', 'created_at', 'updated_at', 'cost_per_participant'], sessionsRows, { override: true })
insert('assign.assignments', ['id', 'course_id', 'title', 'is_required', 'due_kind', 'due_date', 'due_days', 'is_active', 'created_by', 'created_at'], assignmentRows, { override: true })
insert('assign.targets', ['assignment_id', 'kind', 'ref_id', 'include_subunits'], targetRows)
insert('assign.jobs', ['assignment_id', 'employee_id', 'status', 'enrolled', 'withdrawn', 'created_at', 'started_at', 'finished_at'], jobRows)
out.push('-- enrollments')

// certificates
const b32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const usedNumbers = new Set()
const certNumber = (year) => { for (;;) { let s = ''; for (let i = 0; i < 8; i++) s += b32[Math.floor(rand() * 32)]; const n = `LMS-${year}-${s}`; if (!usedNumbers.has(n)) { usedNumbers.add(n); return n } } }

// enrollment rows
insert('learning.enrollments', ['id', 'employee_id', 'course_id', 'version_id', 'source', 'is_required', 'due_date', 'status', 'progress_pct', 'last_lesson_id', 'enrolled_at', 'started_at', 'completed_at'],
  enrollments.map((e) => {
    let last = null
    if (e.k > 0 && e.course.lessons.length) last = e.course.lessons[Math.min(e.k, e.course.lessons.length) - 1].id
    return [e.id, E(e.emp), e.course.id, e.course.versionId, e.source, e.required, e.due, e.status, e.pct, last, ts(e.enrolledAt, 9), e.startedAt ? ts(e.startedAt, 10) : null, e.completedAt ? ts(e.completedAt, 15) : null]
  }), { override: true })
insert('learning.enrollment_assignments', ['enrollment_id', 'assignment_id'], enrollments.filter((e) => e.assignmentId).map((e) => [e.id, e.assignmentId]))
insert('onsite.attendees', ['session_id', 'employee_id', 'enrollment_id', 'attendance', 'marked_by', 'marked_at', 'added_at'], attendeeRows)

// lesson progress and quiz attempts for e-learning and blended lessons
const progressRows = [], attemptRows = []
const scoreOf = (c) => Math.round((c / 5) * 100)
for (const e of enrollments) {
  const c = e.course
  if (!e.k || !c.lessons.length) continue
  const span = e.completedAt ? Math.max(1, Math.round((Date.parse(e.completedAt) - Date.parse(e.startedAt)) / 86400000)) : 4
  c.lessons.slice(0, e.k).forEach((l, idx) => {
    const done = day(e.startedAt, Math.floor(((idx + 1) / e.k) * span))
    const completed = done > todayStr ? todayStr : done
    progressRows.push([e.id, l.id, raw(l.kind === 'VIDEO' ? `'{[0,${l.duration})}'::int4multirange` : `'{}'::int4multirange`), l.kind === 'VIDEO' ? l.duration : 0, ts(completed, 9), ts(completed, 9, 30), ts(completed, 9, 40)])
    if (l.kind === 'QUIZ') {
      const bank = l.bank ?? []
      const frozenOf = () => shuffle(bank).slice(0, 5)
      const attempt = (no, nCorrect, base) => {
        const picked = frozenOf()
        const answers = {}
        picked.forEach((qq, i) => {
          const good = qq.options.filter((o) => o.ok).map((o) => o.id)
          const bad = qq.options.filter((o) => !o.ok).map((o) => o.id)
          answers[qq.id] = i < nCorrect ? good : [pick(bad)]
        })
        const frozen = picked.map((qq) => ({ question_id: qq.id, option_ids: shuffle(qq.options.map((o) => o.id)) }))
        const score = scoreOf(nCorrect)
        attemptRows.push([e.id, l.id, no, raw(`${q(JSON.stringify(frozen))}::jsonb`), raw(`${q(JSON.stringify(answers))}::jsonb`), 'SUBMITTED', score, score >= l.pass, ts(base, 10), ts(base, 10, 12)])
      }
      if (l.role === 'PRE') attempt(1, between(1, 3), completed)
      else if (chance(0.15)) { attempt(1, between(2, 3), day(completed, -1)); attempt(2, between(4, 5), completed) }
      else attempt(1, between(4, 5), completed)
    }
  })
  // some learners stalled after a failed post-test
  if (e.status === 'ACTIVE' && e.k === c.lessons.length - 1 && c.lessons.at(-1).role === 'POST' && chance(0.5)) {
    const l = c.lessons.at(-1), picked = shuffle(l.bank ?? []).slice(0, 5)
    const answers = {}
    picked.forEach((qq, i) => { answers[qq.id] = i < 3 ? qq.options.filter((o) => o.ok).map((o) => o.id) : [qq.options.find((o) => !o.ok).id] })
    attemptRows.push([e.id, l.id, 1, raw(`${q(JSON.stringify(picked.map((qq) => ({ question_id: qq.id, option_ids: qq.options.map((o) => o.id) }))))}::jsonb`), raw(`${q(JSON.stringify(answers))}::jsonb`), 'SUBMITTED', 60, false, ts(day(todayStr, -between(1, 9)), 14), ts(day(todayStr, -between(1, 9)), 14, 10)])
  }
}
insert('learning.lesson_progress', ['enrollment_id', 'lesson_id', 'watched_ranges', 'position_s', 'opened_at', 'last_beat_at', 'completed_at'], progressRows)
insert('learning.quiz_attempts', ['enrollment_id', 'lesson_id', 'attempt_no', 'questions', 'answers', 'status', 'score', 'passed', 'started_at', 'submitted_at'], attemptRows)

// certificates
const certRows = []
const expiring = new Map() // enrollment id -> valid_until override
const completedK3 = enrollments.filter((e) => e.course.code === 'K3-101' && e.status === 'COMPLETED')
if (completedK3[0]) expiring.set(completedK3[0].id, '2026-11-06')
if (completedK3[1]) expiring.set(completedK3[1].id, '2026-10-14')
if (completedK3[2]) expiring.set(completedK3[2].id, '2026-12-02')
for (const e of enrollments) {
  if (e.status !== 'COMPLETED' || !e.course.hasCert) continue
  const p = byNum.get(e.emp)
  const issued = e.completedAt
  let valid = e.course.certMonths ? addMonths(issued, e.course.certMonths) : null
  if (expiring.has(e.id)) valid = expiring.get(e.id)
  certRows.push([certNumber(Number(issued.slice(0, 4))), e.id, E(e.emp), e.course.id, p.name, p.nik, e.course.title, kasubdiv.name, signerTitle, ts(day(issued, 1), 9), valid])
}
insert('cert.certificates', ['number', 'enrollment_id', 'employee_id', 'course_id', 'employee_name', 'employee_nik', 'course_title', 'signer_name', 'signer_title', 'issued_at', 'valid_until'], certRows)

// ---------- learning paths ----------
const lpDefs = {
  Tekpol: { nodes: ['PGS-101', 'PGS-103', 'OPS-205', 'OPS-203', 'OPS-206', 'OPS-201'], edges: [['PGS-103', 'PGS-101'], ['OPS-205', 'PGS-103'], ['OPS-203', 'PGS-103'], ['OPS-206', 'OPS-203'], ['OPS-201', 'OPS-206']] },
  'Quality Assurance': { nodes: ['PGS-102', 'OPS-204', 'HAL-201'], edges: [['OPS-204', 'PGS-102'], ['HAL-201', 'PGS-102']] },
  Tanaman: { nodes: ['TAN-101', 'TAN-201'], edges: [['TAN-201', 'TAN-101']] },
  'HSE & K3': { nodes: ['K3-101', 'K3-202', 'K3-203', 'K3-201', 'K3-204', 'K3-205', 'LNG-201'], edges: [['K3-202', 'K3-101'], ['K3-203', 'K3-101'], ['K3-201', 'K3-101'], ['K3-204', 'K3-203'], ['K3-205', 'K3-202'], ['K3-205', 'K3-203'], ['LNG-201', 'K3-101']] },
  Audit: { nodes: ['AUD-101', 'AUD-201', 'AUD-102', 'AUD-202', 'AUD-203', 'AUD-204', 'AUD-205'], edges: [['AUD-201', 'AUD-101'], ['AUD-102', 'AUD-101'], ['AUD-202', 'AUD-102'], ['AUD-203', 'AUD-202'], ['AUD-204', 'AUD-201'], ['AUD-205', 'AUD-201']] },
  Procurement: { nodes: ['PRC-101', 'PRC-201'], edges: [['PRC-201', 'PRC-101']] },
  'Sistem Management': { nodes: ['SM-101', 'SM-102', 'SM-201'], edges: [['SM-102', 'SM-101'], ['SM-201', 'SM-102']] },
  'Human Capital': { nodes: ['HC-201', 'HC-202', 'HC-203', 'HC-204', 'HC-205', 'LND-201'], edges: [['HC-203', 'HC-201'], ['HC-204', 'HC-201'], ['HC-205', 'HC-203']] },
  IT: { nodes: ['IT-201', 'IT-202'], edges: [['IT-202', 'IT-201']] },
  Finance: { nodes: ['FIN-203', 'FIN-201', 'FIN-202'], edges: [['FIN-201', 'FIN-203'], ['FIN-202', 'FIN-201']] },
  'Data & Analitik': { nodes: ['DAT-101'], edges: [] },
  Culture: { nodes: ['CUL-101'], edges: [] },
}
const cid = (code) => courseByCode.get(code).id
const clusterOf = { OLH: 'Tekpol', TEK: 'Tekpol', TEKPOL: 'Tekpol', OPSPROD: 'Tekpol', RENPROD: 'Tekpol', QA: 'Quality Assurance', TAN: 'Tanaman', TANAMAN: 'Tanaman', KB: 'Tanaman', K3L: 'HSE & K3', SPI: 'Audit', RISIKO: 'Audit', PENGADAAN: 'Procurement', SDM: 'Human Capital', PSDMB: 'Human Capital', TI: 'IT', INFRATI: 'IT', KEUANGAN: 'Finance', AKU: 'Finance', HUKUM: 'Legal dan Management Asset', RENSTRA: 'Strategic', SEKPER: 'Strategic', GM: 'Tekpol', CLUSTER: 'Strategic', DIR: 'Leadership' }
// Each position starts from the path of its job cluster (the paths above); Admin L&D adjusts them per position.
const lpNodes = [], lpEdges = []
for (const [pos, cat] of new Map(people.map((p) => [p.position, clusterOf[p.role] ?? 'Culture']))) {
  const d = lpDefs[cat]
  if (!d) continue
  for (const n of d.nodes) lpNodes.push(`(${q(pos)}, ${cid(n)})`)
  for (const [a, b] of d.edges) lpEdges.push(`(${q(pos)}, ${cid(a)}, ${cid(b)})`)
}
// With real staff the path follows the unit and the job title (FORMASI has no job families): head-office divisions by their
// field, and at mills and estates the title's words. Anything else gets the Culture path.
if (FORMASI) {
  const division = {
    'PTSGN-HO-SPI': 'Audit', 'PTSGN-HO-MR': 'Audit', 'PTSGN-HO-PENGADAAN': 'Procurement', 'PTSGN-HO-PSDMB': 'Human Capital',
    'PTSGN-HO-OSDM': 'Human Capital', 'PTSGN-HO-TI': 'IT', 'PTSGN-HO-AKP': 'Finance', 'PTSGN-HO-PA': 'Finance',
    'PTSGN-HO-QA': 'Quality Assurance', 'PTSGN-HO-TANAMAN': 'Tanaman', 'PTSGN-HO-TR': 'Tanaman', 'PTSGN-HO-PUSLIT': 'Tanaman',
    'PTSGN-HO-LITBANG': 'Tanaman', 'PTSGN-HO-TEKPOL': 'Tekpol', 'PTSGN-HO-SBMP': 'Data & Analitik',
  }
  const atSite = (title) =>
    /K3|SMK3|HSE/i.test(title) ? 'HSE & K3'
      : /TANAMAN|TMA|KEBUN|MANDOR|TEBANG|AREAL|BUDIDAYA|AGRONOMI/i.test(title) ? 'Tanaman'
        : /\bQA\b|QUALITY|LAB|ANALIS/i.test(title) ? 'Quality Assurance'
          : /AKUNTANSI|KEUANGAN|ANGGARAN/i.test(title) ? 'Finance'
            : 'Tekpol'
  for (const p of JSON.parse(readFileSync(`${here}data/private/positions.json`, 'utf8'))) {
    const cat = division[p.unit] ?? (/^PTSGN-(PG|KB)-/.test(p.unit) ? atSite(p.name) : 'Culture')
    const d = lpDefs[cat]
    for (const n of d.nodes) lpNodes.push(`(${q(p.code)}, ${cid(n)})`)
    for (const [a, b] of d.edges) lpEdges.push(`(${q(p.code)}, ${cid(a)}, ${cid(b)})`)
  }
}
if (lpNodes.length) out.push(`INSERT INTO lp.nodes (position_id, course_id) SELECT p.id, v.course FROM (VALUES\n${lpNodes.join(',\n')}\n) AS v(pos, course) JOIN core.positions p ON p.code = v.pos;`)
if (lpEdges.length) out.push(`INSERT INTO lp.edges (position_id, course_id, requires_course_id) SELECT p.id, v.course, v.req FROM (VALUES\n${lpEdges.join(',\n')}\n) AS v(pos, course, req) JOIN core.positions p ON p.code = v.pos;`)

// ---------- competency targets and assessments ----------
const targetsByRole = {
  OLH: ['Pengetahuan Proses Pabrik Gula', 'Pengoperasian Stasiun Gilingan', 'Pemeliharaan Mesin Pabrik', 'Keselamatan dan Kesehatan Kerja'],
  TEK: ['Pemeliharaan Mesin Pabrik', 'Keselamatan dan Kesehatan Kerja', 'Pengoperasian Stasiun Gilingan'],
  QA: ['Analisa Mutu Nira', 'Audit Mutu dan Rantai Pasok', 'Sistem Manajemen Lingkungan'],
  TAN: ['Budidaya dan Tebang Muat Angkut', 'Keselamatan dan Kesehatan Kerja'],
  KB: ['Budidaya dan Tebang Muat Angkut', 'Keselamatan dan Kesehatan Kerja'],
  AKU: ['Akuntansi dan Pelaporan Keuangan', 'Pengadaan Barang dan Jasa'],
  GM: ['Perencanaan Strategis', 'Keselamatan dan Kesehatan Kerja'],
  CLUSTER: ['Perencanaan Strategis'],
  SPI: ['Audit Internal', 'Pengendalian Internal Pelaporan Keuangan'],
  RISIKO: ['Pengendalian Internal Pelaporan Keuangan', 'Audit Mutu dan Rantai Pasok'],
  SDM: ['Pengelolaan Pengembangan SDM'],
  PSDMB: ['Pengelolaan Pengembangan SDM', 'Analisis Data dan Pemecahan Masalah'],
  K3L: ['Keselamatan dan Kesehatan Kerja', 'Sistem Manajemen Lingkungan'],
  PENGADAAN: ['Pengadaan Barang dan Jasa'],
  KEUANGAN: ['Akuntansi dan Pelaporan Keuangan', 'Pengendalian Internal Pelaporan Keuangan'],
  HUKUM: ['Pengelolaan Aset'],
  TI: ['Keamanan Informasi', 'Analisis Data dan Pemecahan Masalah'],
  INFRATI: ['Keamanan Informasi'],
  RENSTRA: ['Perencanaan Strategis', 'Analisis Data dan Pemecahan Masalah'],
  SEKPER: ['Perencanaan Strategis'],
  TEKPOL: ['Pengetahuan Proses Pabrik Gula', 'Pemeliharaan Mesin Pabrik', 'Pengoperasian Stasiun Gilingan'],
  TANAMAN: ['Budidaya dan Tebang Muat Angkut'],
  OPSPROD: ['Pengetahuan Proses Pabrik Gula', 'Analisa Mutu Nira'],
  RENPROD: ['Analisis Data dan Pemecahan Masalah'],
  DIR: ['Perencanaan Strategis'],
}
const leaders = new Set(['GM', 'CLUSTER', 'DIR'])
const targetPairs = new Map()
for (const p of people) {
  const list = [...(targetsByRole[p.role] ?? []), 'Nilai AKHLAK', 'Integritas dan Etika Kerja']
  if (p.head) list.push('Kepemimpinan dan Pengambilan Keputusan')
  if (['OLH', 'TAN', 'AKU', 'QA', 'TEK'].includes(p.role) && !p.head) list.push('Komunikasi dan Kolaborasi')
  for (const name of list) targetPairs.set(`${p.position}|${name}`, [p.position, name])
}
// (Required competencies per position no longer exist; the pairs only pick whom to assess on what.)

const assessRows = []
for (const p of shuffle(people).slice(0, 60)) {
  const targets = [...targetPairs.values()].filter(([pos]) => pos === p.position).map(([, name]) => name)
  const picked = shuffle(targets).slice(0, between(2, 4))
  const assessor = headOf(p) ?? kadivSdm
  for (const name of picked) {
    const achieved = chance(0.68)
    assessRows.push([E(p.employee_number), compId.get(name), E(assessor.employee_number), achieved ? pick(['Sudah konsisten menerapkan pada pekerjaan.', 'Menjadi rujukan rekan satu tim.', null]) : pick(['Perlu pendampingan dan latihan tambahan.', 'Belum konsisten pada kondisi beban tinggi.', 'Disarankan mengikuti pelatihan lanjutan.']), ts(day(todayStr, -between(10, 180)), 11), achieved])
  }
}
insert('comp.assessments', ['employee_id', 'competency_id', 'assessed_by', 'note', 'assessed_at', 'achieved'], assessRows)

// ---------- evaluation: reactions, behaviours, rounds, impacts ----------
const comments = ['Materi relevan dan langsung bisa dipakai di pabrik.', 'Pemateri menjelaskan dengan contoh lapangan, mudah dipahami.', 'Durasi terasa kurang untuk praktik; tambahkan sesi latihan.', 'Mohon materi dibagikan lebih awal sebelum pelatihan.', 'Tempat dan konsumsi baik. Jadwal sebaiknya tidak bersamaan dengan giling.', 'Perlu studi kasus dari pabrik lain agar lebih beragam.', 'Sangat membantu untuk pekerjaan sehari-hari.', null, null, null]
const reactionRows = []
for (const e of enrollments) {
  if (e.status !== 'COMPLETED') continue
  const onsiteCourse = Boolean(e.course.sessionList)
  if (!chance(onsiteCourse ? 0.6 : 0.35)) continue
  const rate = () => (chance(0.62) ? 5 : chance(0.8) ? 4 : 3)
  const when = minDate(day(e.completedAt, between(0, 3)), todayStr)
  const access = [5, 4, 4, 3, 5, 4][e.id % 6]
  reactionRows.push([e.id, E(e.emp), e.course.id, rate(), rate(), access, chance(0.92), pick(comments), ts(when, 16), ts(when, 16)])
}
insert('ev.reactions', ['enrollment_id', 'employee_id', 'course_id', 'material', 'relevance', 'access', 'recommend', 'comment', 'created_at', 'updated_at'], reactionRows)

const behaviorRows = []
const strength = new Map(courses.map((c) => [c.id, 0.3 + rand() * 0.65]))
const notes = ['Mulai menerapkan hasil pelatihan pada pekerjaan rutin.', 'Perlu dorongan agar konsisten setelah beban kerja musim giling.', 'Berbagi hasil pelatihan kepada rekan satu tim.', null, null, null, 'Menyusun rencana tindak lanjut bersama atasan.']
for (const e of enrollments) {
  if (e.status !== 'COMPLETED' || !e.course.sessionList) continue
  if (e.sessionEnd > '2026-08-31') continue
  const p = byNum.get(e.emp)
  const rater = headOf(p)
  if (!rater || !chance(0.72)) continue
  const rated = day(e.sessionEnd, between(35, 90))
  if (rated > day(todayStr, -2)) continue
  const s = strength.get(e.course.id)
  const after = () => (chance(s) ? 5 : 4)
  const before = () => between(2, 4)
  const v = []
  for (let i = 0; i < 5; i++) v.push(before(), after())
  behaviorRows.push([e.id, E(e.emp), e.course.id, E(rater.employee_number), pick(notes), ts(rated, 14), ...v])
}
insert('ev.behaviors', ['enrollment_id', 'employee_id', 'course_id', 'rater_employee_id', 'note', 'rated_at', 'knowledge_before', 'knowledge_after', 'skill_before', 'skill_after', 'attitude_before', 'attitude_after', 'behavior1_before', 'behavior1_after', 'behavior2_before', 'behavior2_after'], behaviorRows)

if (!FORMASI) {
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus']
const staffLd = [byNum.get('PTSGN-1035'), byNum.get('PTSGN-1036')]
const roundRows = monthNames.map((_, i) => {
  const month = `2026-${String(i + 1).padStart(2, '0')}-01`
  const letterDate = `2026-${String(i + 3).padStart(2, '0')}-07`
  const deadline = i >= 6 ? (i === 6 ? '2026-10-30' : '2026-11-13') : day(letterDate, 21)
  return [month, deadline, `BD05-KOLE-SBI/${letterDate.replaceAll('-', '')}.001`, letterDate, kadivSdm.name, 'Kepala Divisi SDM', `Staf Learning and Development: ${staffLd[0].name} dan ${staffLd[1].name} (learning@sgn.example)`, E(admin), ts(letterDate, 10)]
})
insert('ev.rounds', ['month', 'deadline', 'letter_number', 'letter_date', 'signer_name', 'signer_title', 'contacts', 'updated_by', 'updated_at'], roundRows)

insert('ev.impacts', ['course_id', 'process_name', 'indicator', 'baseline_value', 'result_value', 'period_label', 'summary', 'created_by', 'created_at', 'updated_at'], [
  [cid('OPS-201'), 'Stasiun gilingan', 'Pol ampas (%)', '2,10', '1,92', 'Mei sampai Agustus 2026', 'Contoh ilustrasi: pol ampas turun setelah misi mingguan diterapkan di pabrik peserta.', E(admin), ts('2026-09-10', 10), ts('2026-09-10', 10)],
  [cid('PRC-201'), 'Pengadaan suku cadang', 'Selisih HPS terhadap harga kontrak (%)', '9,0', '5,5', 'Maret sampai Agustus 2026', 'Contoh ilustrasi: akurasi HPS membaik karena sumber harga terdokumentasi.', E(admin), ts('2026-09-14', 10), ts('2026-09-14', 10)],
  [cid('K3-202'), 'Penanganan cedera ringan', 'Waktu penanganan pertama (menit)', '12', '6', 'Februari sampai Agustus 2026', 'Contoh ilustrasi: petugas P3K bersertifikat mempersingkat penanganan awal.', E(admin), ts('2026-09-20', 10), ts('2026-09-20', 10)],
  [cid('AUD-202'), 'Pengujian kontrol ICoFR', 'Kontrol teruji tepat waktu (%)', '70', '92', 'Juni sampai Agustus 2026', 'Contoh ilustrasi: kertas kerja ToD dan ToE seragam mempercepat pengujian.', E(admin), ts('2026-09-25', 10), ts('2026-09-25', 10)],
])

}

// ---------- credentials ----------
const credDefs = [
  ['PTSGN-1043', 'CERTIFICATION', 'Ahli K3 Umum', 'Kementerian Ketenagakerjaan RI', 'AK3U/2025/04817', '2025-03-10', '2028-03-10', 'VERIFIED', null],
  ['PTSGN-1038', 'CERTIFICATE', 'Quality Management System Internal Auditor', 'Lembaga sertifikasi mitra', 'QMS-IA-2023-0912', '2023-11-14', '2026-11-12', 'VERIFIED', null],
  ['PTSGN-1028', 'CERTIFICATION', 'Qualified Internal Auditor (QIA)', 'Lembaga profesi auditor internal', 'QIA-2024-3321', '2024-08-20', '2027-08-20', 'VERIFIED', null],
  ['PTSGN-1037', 'CERTIFICATE', 'Pelatihan Teknologi Pengolahan Gula', 'Institut pendidikan perkebunan mitra', null, '2024-05-03', null, 'VERIFIED', null],
  ['PTSGN-1039', 'CERTIFICATION', 'Operator Boiler Kelas II', 'Kementerian Ketenagakerjaan RI', 'BLR-II/2024/1190', '2024-01-22', '2027-01-22', 'VERIFIED', null],
  ['PTSGN-1025', 'CERTIFICATION', 'Ahli Pengadaan Barang/Jasa Level 1', 'Lembaga kebijakan pengadaan', 'AP1-2025-7781', '2025-06-18', '2028-06-18', 'VERIFIED', null],
  ['PTSGN-1041', 'CERTIFICATE', 'Pelatihan Budidaya Tebu Lahan Kering', 'Balai penelitian tanaman pemanis', null, '2026-09-30', null, 'PENDING', null],
  ['PTSGN-1042', 'CERTIFICATION', 'Auditor Internal SMK3', 'Lembaga sertifikasi mitra', 'SMK3-AI-2026-114', '2026-10-05', '2029-10-05', 'PENDING', null],
  ['PTSGN-1044', 'CERTIFICATE', 'Pelatihan Pemadam Kebakaran Tingkat Dasar', 'Dinas pemadam kebakaran setempat', null, '2026-09-12', null, 'PENDING', null],
  ['PTSGN-1036', 'CERTIFICATE', 'Pelatihan Analisis Data', 'Penyelenggara pelatihan daring', null, '2026-08-01', null, 'REJECTED', 'Berkas yang diunggah kabur sehingga nomor dan nama tidak terbaca. Mohon unggah ulang pindaian yang jelas.'],
]
if (!FORMASI) insert('cert.credentials', ['employee_id', 'kind', 'title', 'issuer', 'credential_number', 'issued_on', 'valid_until', 'media_id', 'status', 'review_note', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at'],
  credDefs.map((d, i) => [E(d[0]), d[1], d[2], d[3], d[4], d[5], d[6], raw(`${media[`scan-${i + 1}`].id}`), d[7], d[8], d[7] === 'PENDING' ? null : E(admin), d[7] === 'PENDING' ? null : ts(day(d[5], 6), 11), ts(day(d[5], 3), 10), ts(day(d[5], 6), 11)]))

// ---------- LNA ----------
const periods = [[1, 'Periode LNA 2026', '2025-10-01', '2025-11-30'], [2, 'Periode LNA 2027', '2026-10-01', '2026-11-15']]
insert('lna.periods', ['id', 'name', 'opens_on', 'closes_on', 'created_by', 'created_at'], periods.map((p) => [...p, E(admin), ts(p[2], 9)]), { override: true })
// topic is stored as the proposal's section; the old three levels map to Directory position levels.
const bodLevel = { STRATEGIC: 5, TACTICAL: 6, OPERATOR: 8 }
const operational = new Set(['Operasional', 'Teknik', 'Tanaman', 'Sertifikasi K3'])
// [period, proposer, title, topic, level, participants, estimated, approved, justification, status, submittedAt, competency, rejectedStep, note]
const proposals = [
  [1, 'PTSGN-1043', 'Sertifikasi K3 Juru Las Batch 1 sampai 3', 'Sertifikasi K3', 'OPERATOR', 24, 140000000, 130000000, 'Pekerjaan las di pabrik dan bengkel wajib dilakukan juru las bersertifikat; sebagian sertifikat habis berlaku pada 2026.', 'APPROVED', '2025-10-14', 'Keselamatan dan Kesehatan Kerja'],
  [1, 'PTSGN-1025', 'Precision Procurement: Specification Clarity dan Owner Estimate Accuracy', 'Pengadaan', 'TACTICAL', 66, 190000000, 176000000, 'Selisih HPS terhadap harga kontrak dan spesifikasi yang tidak jelas menyebabkan pengadaan ulang.', 'APPROVED', '2025-10-20', 'Pengadaan Barang dan Jasa'],
  [1, 'PTSGN-1034', 'Pelatihan dan Sertifikasi CHRP', 'Human Capital', 'TACTICAL', 3, 45000000, 42000000, 'Memperkuat kapabilitas tim SDM dalam perencanaan dan pengembangan talenta.', 'APPROVED', '2025-10-28', 'Pengelolaan Pengembangan SDM'],
  [1, 'PTSGN-1019', 'Widyakarya Studi Industri Gula di Luar Negeri', 'Strategis', 'STRATEGIC', 7, 250000000, null, 'Belajar praktik efisiensi energi dan recovery dari industri gula negara lain.', 'REJECTED', '2025-11-03', 'Perencanaan Strategis', 'HR', 'Anggaran perjalanan luar negeri dialihkan ke program pelatihan di dalam negeri.'],
  [1, 'PTSGN-1037', 'In House Training Operational Excellence Jatim IV', 'Operasional', 'OPERATOR', 58, 30000000, 26000000, 'Menyamakan standar kerja operator pabrik gula Cluster Jawa Timur IV.', 'APPROVED', '2025-11-10', 'Pengetahuan Proses Pabrik Gula'],
  [2, 'PTSGN-1039', 'Pelatihan Pemeliharaan Prediktif (Vibrasi dan Termografi)', 'Teknik', 'TACTICAL', 12, 96000000, null, 'Menekan henti mesin mendadak pada stasiun gilingan dan ketel.', 'PENDING_HEAD', '2026-10-16', 'Pemeliharaan Mesin Pabrik'],
  [2, 'PTSGN-1038', 'IHT Setelan Gilingan dan Imbibisi untuk Operator Shift', 'Operasional', 'OPERATOR', 40, 28000000, null, 'Pol ampas masih bervariasi antar-shift; operator butuh standar setelan yang sama.', 'PENDING_HEAD', '2026-10-17', 'Pengoperasian Stasiun Gilingan'],
  [2, 'PTSGN-1043', 'Sertifikasi Operator Boiler Kelas I', 'Sertifikasi K3', 'OPERATOR', 14, 84000000, null, 'Operator ketel kelas I dibutuhkan untuk memenuhi persyaratan izin operasi.', 'PENDING_HR', '2026-10-08', 'Keselamatan dan Kesehatan Kerja'],
  [2, 'PTSGN-1036', 'Analisis Data dengan Power BI untuk Laporan Produksi', 'Data', 'TACTICAL', 18, 54000000, null, 'Laporan produksi masih disusun manual dan memakan waktu dua hari setiap bulan.', 'PENDING_HR', '2026-10-09', 'Analisis Data dan Pemecahan Masalah'],
  [2, 'PTSGN-1025', 'Sertifikasi Ahli Pengadaan Barang/Jasa Level 1 dan 2', 'Pengadaan', 'TACTICAL', 8, 56000000, null, 'Pejabat pengadaan unit kerja perlu sertifikasi untuk memenuhi pedoman terbaru.', 'APPROVED', '2026-10-03', 'Pengadaan Barang dan Jasa'],
  [2, 'PTSGN-1019', 'Pelatihan Kepemimpinan Manajer Pabrik (Mission Based Leadership)', 'Kepemimpinan', 'STRATEGIC', 25, 275000000, null, 'Menindaklanjuti program Mission Based Approach dengan penguatan kepemimpinan manajer pabrik.', 'APPROVED', '2026-10-02', 'Kepemimpinan dan Pengambilan Keputusan'],
  [2, 'PTSGN-1028', 'Pelatihan Internal Auditor SMK3', 'Audit', 'TACTICAL', 10, 60000000, 55000000, 'Mendukung audit internal SMK3 tahunan di pabrik.', 'APPROVED', '2026-10-01', 'Audit Internal'],
  [2, 'PTSGN-1037', 'Refreshing Dasar Proses Pengolahan Tebu untuk Karyawan Baru', 'Operasional', 'OPERATOR', 30, 21000000, 21000000, 'Karyawan baru perlu memahami alur pabrik sebelum musim giling.', 'APPROVED', '2026-10-02', 'Pengetahuan Proses Pabrik Gula'],
  [2, 'PTSGN-1038', 'Studi Banding Pabrik Gula di Brasil', 'Strategis', 'STRATEGIC', 6, 320000000, null, 'Mempelajari integrasi pabrik gula dan etanol.', 'REJECTED', '2026-10-04', 'Perencanaan Strategis', 'HR', 'Belum sesuai prioritas tahun 2027; disarankan webinar atau kunjungan dalam negeri.'],
  [2, 'PTSGN-1041', 'Pelatihan Budidaya Tebu Lahan Kering', 'Tanaman', 'TACTICAL', 15, 45000000, null, 'Sebagian areal baru berada di lahan kering dan membutuhkan teknik budidaya khusus.', 'PENDING_HEAD', '2026-10-18', 'Budidaya dan Tebang Muat Angkut'],
  [2, 'PTSGN-1029', 'Workshop Penyusunan Standar Biaya Pemeliharaan', 'Keuangan', 'TACTICAL', 6, 24000000, null, 'Standar biaya pemeliharaan belum seragam antar-pabrik.', 'WITHDRAWN', '2026-10-05', 'Akuntansi dan Pelaporan Keuangan'],
]
// One person per unit files proposals. In the open period the unit's representative files on behalf of colleagues;
// the older period keeps who actually filed then.
const filer = { 'PTSGN-1038': 'PTSGN-1039', 'PTSGN-1037': 'PTSGN-1039', 'PTSGN-1029': 'PTSGN-1028' }
if (FORMASI) proposals.length = 0
for (const p of proposals) if (p[0] === 2) p[1] = filer[p[1]] ?? p[1]
const stepRows = []
const propRows = proposals.map((p, i) => {
  const id = i + 1
  const [period, num, title, topic, level, n, est, approved, why, status, submitted, comp, rejStep, note] = p
  const who = byNum.get(num)
  const head = headOf(who) ?? kadivSdm
  // Kadiv (head) then SDM (HR), the last step; Mankeu left the chain on 2026-10-27.
  const steps = { HEAD: 'WAITING', HR: 'WAITING' }
  if (status === 'PENDING_HEAD') steps.HEAD = 'PENDING'
  if (status === 'PENDING_HR') Object.assign(steps, { HEAD: 'APPROVED', HR: 'PENDING' })
  if (status === 'APPROVED') Object.assign(steps, { HEAD: 'APPROVED', HR: 'APPROVED' })
  if (status === 'REJECTED') Object.assign(steps, rejStep === 'HEAD' ? { HEAD: 'REJECTED', HR: 'CANCELLED' } : { HEAD: 'APPROVED', HR: 'REJECTED' })
  if (status === 'WITHDRAWN') Object.assign(steps, { HEAD: 'CANCELLED', HR: 'CANCELLED' })
  let t = submitted
  const decider = { HEAD: head.employee_number, HR: 'PTSGN-1011' }
  let last = submitted
  for (const step of ['HEAD', 'HR']) {
    const st = steps[step]
    const decided = ['APPROVED', 'REJECTED'].includes(st)
    if (decided) { t = day(t, between(1, 4)); last = t }
    stepRows.push([id, step, st, ['PENDING', 'APPROVED', 'REJECTED'].includes(st) ? ts(decided ? day(t, -1) : last, 9) : null, decided ? E(decider[step]) : null, st === 'REJECTED' ? note : decided ? pick(['Disetujui.', 'Sesuai prioritas unit.', null]) : null, decided ? ts(t, 14) : null])
  }
  return [id, period, E(num), raw(`(SELECT unit_id FROM e WHERE num = ${q(num)})`), title, `Peserta mampu menerapkan hasil pelatihan ini dalam pekerjaan unit kerjanya: ${title}.`, bodLevel[level], topic, operational.has(topic) ? 'OPERATIONAL' : 'SUPPORTING', n, est, approved, why, raw(`${compId.get(comp)}`), status, ts(submitted, 9), ['APPROVED', 'REJECTED'].includes(status) ? ts(last, 14) : null, ts(last, 14)]
})
insert('lna.proposals', ['id', 'period_id', 'proposer_id', 'unit_id', 'title', 'objective', 'target_level', 'section', 'nature', 'participants', 'estimated_cost', 'approved_cost', 'justification', 'competency_id', 'status', 'submitted_at', 'decided_at', 'updated_at'], propRows, { override: true })
insert('lna.steps', ['proposal_id', 'step', 'status', 'pending_at', 'decided_by', 'notes', 'decided_at'], stepRows)
// Representatives: each unit's head, then whoever files this period's proposals (Joko Gunawan for Divisi Teknik dan
// Pengolahan).
out.push(`INSERT INTO lna.representatives (unit_id, employee_id)
SELECT DISTINCT ON (x.unit_id) x.unit_id, x.id FROM core.employees x JOIN core.positions ps ON ps.id = x.position_id
WHERE x.is_active AND ps.is_head AND x.unit_id IS NOT NULL ORDER BY x.unit_id, x.id;`)
for (const num of new Set(proposals.filter((p) => p[0] === 2).map((p) => p[1]))) {
  out.push(`INSERT INTO lna.representatives (unit_id, employee_id) SELECT unit_id, id FROM e WHERE num = ${q(num)}
ON CONFLICT (unit_id) DO UPDATE SET employee_id = EXCLUDED.employee_id;`)
}

// ---------- Knowledge Hub ----------
const itemRows = [], tagRows = [], imgRows = [], itemComp = [], readRows = [], favRows = []
articles.forEach((a, i) => {
  const id = i + 1
  const author = FORMASI ? ld.trainer : byNum.get(a.author)
  const when = day(todayStr, -a.days)
  const images = []
  const html = a.html.replace(/\{\{img:(.+?)\}\}/g, (_, k) => { images.push(media[k].id); return String(media[k].id) })
  itemRows.push([id, 'ARTICLE', a.title, a.summary, null, null, khCat(a.category), 'PUBLISHED', E(a.author), false, ts(when, 8), ts(when, 8), ts(when, 8), null, raw(`${media[`${a.key}-cover`].id}`), html, 'HTML', author.name])
  for (const t of a.tags) tagRows.push([id, t])
  for (const m of images) imgRows.push([id, raw(`${m}`)])
  for (const name of a.competencies) itemComp.push([id, compId.get(name)])
  for (const p of shuffle(people).slice(0, between(10, 34))) readRows.push([id, E(p.employee_number), between(1, 4), ts(when, 12), ts(minDate(day(when, between(0, 10)), todayStr), 15)])
  for (const p of shuffle(people).slice(0, between(2, 7))) favRows.push([E(p.employee_number), id, ts(when, 13)])
})
insert('kh.items', ['id', 'kind', 'title', 'summary', 'body_md', 'media_id', 'category_id', 'status', 'author_id', 'is_sample', 'published_at', 'created_at', 'updated_at', 'link_url', 'cover_media_id', 'body_html', 'body_format', 'author_name'], itemRows, { override: true })
insert('kh.tags', ['item_id', 'tag'], tagRows)
insert('kh.item_images', ['item_id', 'media_id'], imgRows)
insert('kh.item_competencies', ['item_id', 'competency_id'], itemComp)
{
  const seen = new Set()
  const uniq = (r, k) => r.filter((x) => { const key = k(x); if (seen.has(key)) return false; seen.add(key); return true })
  insert('kh.reads', ['item_id', 'employee_id', 'reads', 'first_read_at', 'last_read_at'], uniq(readRows, (x) => `${x[0]}|${x[1].s}`))
  seen.clear()
  insert('kh.favorites', ['employee_id', 'item_id', 'created_at'], uniq(favRows, (x) => `${x[0].s}|${x[1]}`))
}

// ---------- preferences ----------
const prefRows = [], interestRows = []
for (const p of shuffle(people).slice(0, 18)) {
  prefRows.push([E(p.employee_number), true, true, pick([3, 7, 14]), true, pick([30, 60, 90]), true, true, chance(0.5) ? 'ALL' : 'INTERESTS', true, pick([1, 3, 7])])
  const cl = clusterOf[p.role]
  if (cl) interestRows.push([E(p.employee_number), catId(cl)])
}
insert('learning.preferences', ['employee_id', 'notify_assigned', 'notify_due_soon', 'due_soon_days', 'notify_cert_expiring', 'cert_expiring_days', 'notify_evaluation', 'notify_new_course', 'new_course_scope', 'notify_session', 'session_days'], prefRows)
insert('learning.interest_clusters', ['employee_id', 'category_id'], interestRows)

// ---------- PSDM pilot ----------
// The modules of the PSDM pilot (data/piloting.mjs): one published e-learning course per module, holding its PDF. Each pilot
// position gets a learning path of its unit's main module followed by the assigned modules (or the open ones when the unit
// has none assigned), and the assigned modules become required assignments due at year end. Open modules sit in the
// catalogue for everyone. The pilot people start fresh, so the demo can show them from the first click. No random draws
// here, so the history above is unchanged.
{
  const PILOT_DAY = '2026-10-19', PILOT_DUE = '2026-12-31'
  const mark = Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v.length]))
  const byCode = new Map()
  for (const u of pilotUnits) {
    for (const m of u.modules) {
      if (m.sameAs) continue
      const c = addCourse({
        code: m.code, title: m.title, category: u.category, owner: FORMASI ? ld.trainer.employee_number : admin, hours: Math.max(1, Math.round(m.pages / 25)), hasCert: false,
        publishedAt: PILOT_DAY, cover: `cover-${m.code}`, summary: 'Modul dari Tim PSDM untuk piloting SUGARLedge. Baca materinya sampai selesai di halaman ini.',
        goals: '- Memahami isi modul dan kaitannya dengan pekerjaan.\n- Menerapkannya pada pekerjaan sehari-hari.',
      })
      const sec = addSection(c, 'Materi', 1)
      addLesson(c, sec, 1, { kind: 'DOCUMENT', title: m.title, media: media[`doc-${m.code}`].id })
      byCode.set(m.code, c)
    }
  }
  insert('course.courses', ['id', 'code', 'owner_id', 'is_archived', 'created_at'], rows.courses.slice(mark.courses), { override: true })
  insert('course.versions', ['id', 'course_id', 'version_no', 'status', 'title', 'summary', 'description_md', 'objectives_md', 'category_id', 'cover_media_id', 'is_open', 'sequential', 'has_certificate', 'certificate_valid_months', 'estimated_minutes', 'review_notes', 'submitted_by', 'submitted_at', 'published_at', 'published_by', 'created_at', 'updated_at', 'delivery_method', 'learning_hours', 'cost_per_participant', 'behavior_target_1', 'behavior_target_2'], rows.versions.slice(mark.versions), { override: true })
  insert('course.course_trainers', ['course_id', 'employee_id'], rows.trainers.slice(mark.trainers))
  insert('course.sections', ['id', 'version_id', 'title', 'position'], rows.sections.slice(mark.sections), { override: true })
  insert('course.lessons', ['id', 'section_id', 'position', 'kind', 'title', 'is_required', 'media_id', 'subtitle_media_id', 'body_md', 'allow_download', 'pass_score', 'max_attempts', 'time_limit_min', 'question_count', 'shuffle', 'show_review', 'quiz_role'], rows.lessons.slice(mark.lessons), { override: true })

  // The positions that take a block: the made-up pilot (plus the sheet's extra SDM assignees), or with real staff every
  // position of the block's units, narrowed to `titles` when given.
  const realPositions = FORMASI ? JSON.parse(readFileSync(`${here}data/private/positions.json`, 'utf8')) : []
  const realPeople = FORMASI ? JSON.parse(readFileSync(`${here}data/private/people.json`, 'utf8')) : []
  const postsOf = (u) =>
    FORMASI
      ? realPositions.filter((p) => u.formasi.units.includes(p.unit) && (!u.formasi.titles || u.formasi.titles.includes(p.name))).map((p) => p.code)
      : [u.pilot]
  const holdersOf = (codes) => (FORMASI ? realPeople.filter((p) => codes.includes(p.position)).length : codes.length)
  const unitRef = (code) => raw(`(SELECT id FROM core.org_units WHERE code = ${q(code)})`)
  const posRef = (code) => raw(`(SELECT id FROM core.positions WHERE code = ${q(code)})`)
  const pilotAssignments = [], pilotTargets = [], pilotJobs = [], pilotEnrol = []
  let assignmentId = assignmentDefs.length
  for (const u of pilotUnits) {
    const mods = u.modules.filter((m) => !m.sameAs)
    const lp = mods.find((m) => m.role === 'lp')
    const assigned = mods.filter((m) => m.role === 'assigned')
    const rest = assigned.length ? assigned : mods.filter((m) => m.role === 'open')
    const nodes = [...(lp ? [lp] : []), ...rest]
    const posts = postsOf(u)
    const list = posts.map(q).join(', ')
    out.push(`DELETE FROM lp.nodes WHERE position_id IN (SELECT id FROM core.positions WHERE code IN (${list}));`)
    out.push(`INSERT INTO lp.nodes (position_id, course_id) SELECT p.id, v.course FROM (VALUES ${nodes.map((m) => `(${byCode.get(m.code).id})`).join(', ')}) AS v(course), core.positions p WHERE p.code IN (${list});`)
    if (lp && rest.length) out.push(`INSERT INTO lp.edges (position_id, course_id, requires_course_id) SELECT p.id, v.course, ${byCode.get(lp.code).id} FROM (VALUES ${rest.map((m) => `(${byCode.get(m.code).id})`).join(', ')}) AS v(course), core.positions p WHERE p.code IN (${list});`)
    for (const m of assigned) {
      const c = byCode.get(m.code)
      const id = ++assignmentId
      const who = FORMASI ? posts : [...posts, ...(extraAssignees[m.code] ?? [])]
      pilotAssignments.push([id, c.id, `Piloting: ${m.title}`, true, 'FIXED', PILOT_DUE, null, true, E(admin), ts(PILOT_DAY, 10)])
      if (FORMASI && !u.formasi.titles) for (const unit of u.formasi.units) pilotTargets.push([id, 'UNIT', unitRef(unit), false])
      else for (const w of who) pilotTargets.push([id, 'POSITION', posRef(w), false])
      pilotJobs.push([id, E(admin), 'DONE', holdersOf(who), 0, ts(PILOT_DAY, 10), ts(PILOT_DAY, 10), ts(PILOT_DAY, 10)])
      pilotEnrol.push({ id, course: c, posts: who })
    }
  }
  insert('assign.assignments', ['id', 'course_id', 'title', 'is_required', 'due_kind', 'due_date', 'due_days', 'is_active', 'created_by', 'created_at'], pilotAssignments, { override: true })
  insert('assign.targets', ['assignment_id', 'kind', 'ref_id', 'include_subunits'], pilotTargets)
  insert('assign.jobs', ['assignment_id', 'employee_id', 'status', 'enrolled', 'withdrawn', 'created_at', 'started_at', 'finished_at'], pilotJobs)
  // Everyone holding the positions, as the assignment job would enrol them; ids continue after the history's.
  out.push(`SELECT setval(pg_get_serial_sequence('learning.enrollments', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM learning.enrollments), false);`)
  for (const a of pilotEnrol) {
    out.push(`WITH ins AS (INSERT INTO learning.enrollments (employee_id, course_id, version_id, source, is_required, due_date, status, progress_pct, enrolled_at)
SELECT x.id, ${a.course.id}, ${a.course.versionId}, 'ASSIGNMENT', true, ${q(PILOT_DUE)}, 'ACTIVE', 0, ${q(ts(PILOT_DAY, 10))} FROM core.employees x JOIN core.positions ps ON ps.id = x.position_id
WHERE x.is_active AND ps.code IN (${a.posts.map(q).join(', ')}) ON CONFLICT DO NOTHING RETURNING id)
INSERT INTO learning.enrollment_assignments (enrollment_id, assignment_id) SELECT id, ${a.id} FROM ins;`)
  }
  console.log(`pilot: courses ${byCode.size}, assignments ${pilotAssignments.length}, holders ${pilotJobs.reduce((n, j) => n + j[3], 0)}`)
}

// ---------- sequences ----------
for (const t of sequences) out.push(`SELECT setval(pg_get_serial_sequence('${t}', 'id'), (SELECT COALESCE(max(id), 1) FROM ${t}));`)
out.push('COMMIT;')
writeFileSync(`${here}sql/30_lms.sql`, `${out.join('\n')}\n`)
console.log(`courses ${courses.length}, sessions ${sessionsRows.length}, enrollments ${enrollments.length}, attendees ${attendeeRows.length}, certificates ${certRows.length}, behaviors ${behaviorRows.length}, reactions ${reactionRows.length}`)
