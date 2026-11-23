// Generates seed/sql/10_directory.sql (units, positions, people, assignments) and seed/data/people.json from data/org.mjs.
// Deterministic: the same input always gives the same names, numbers, and dates.
import { writeFileSync } from 'node:fs'
import { bagian, bigMills, clusters, heads, hoUnits, lateUnits, names, taken } from '../data/org.mjs'

let seed = 20261020
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 2 ** 32
}
const pick = (a) => a[Math.floor(rand() * a.length)]
const between = (a, b) => a + Math.floor(rand() * (b - a + 1))
const q = (s) => `'${String(s).replaceAll("'", "''")}'`

const used = new Set(taken)
const emails = new Set()
function person(gender, area) {
  const male = area === 'sumatra' ? names.sumatraM : area === 'sulawesi' ? names.sulawesiM : names.javanese
  const female = area === 'sumatra' ? names.sumatraF : area === 'sulawesi' ? names.sulawesiF : names.javaneseF
  for (;;) {
    const first = gender === 'F' ? pick(female) : pick(male)
    const last = pick(names.surnames)
    const full = `${first} ${last}`
    if (!used.has(full)) {
      used.add(full)
      let mail = `${first}.${last}`.toLowerCase().replace(/\s+/g, '')
      while (emails.has(mail)) mail += between(2, 9)
      emails.add(mail)
      return { full, mail: `${mail}@sgn.example` }
    }
  }
}

const units = [] // {code, name, parent, level}
const positions = [] // {code, name, level, unit, parent, head, fn, edu, person?}
const hoProv = ['31', '35', '32']

// Existing head-office positions get people too; the sample people who held them are gone.
const existing = [
  ['PTSGN-POS-DIRUT', 'PTSGN-DIR-UTAMA', 1, true, 'Manajemen Eksekutif', ['S2', 'Manajemen']],
  ['PTSGN-POS-KADIV-RENSTRA', 'PTSGN-DIV-RENSTRA', 2, true, 'Perencanaan & Strategi', ['S2', 'Manajemen Strategis']],
  ['PTSGN-POS-STAF-RENSTRA-01', 'PTSGN-DIV-RENSTRA', 3, false, 'Perencanaan & Strategi', ['S1', 'Teknik Industri']],
  ['PTSGN-POS-STAF-RENSTRA-02', 'PTSGN-DIV-RENSTRA', 3, false, 'Perencanaan & Strategi', ['S1', 'Ekonomi Pembangunan']],
  ['PTSGN-POS-KADIV-SEKPER', 'PTSGN-DIV-SEKPER', 2, true, 'Sekretariat & Hukum', ['S1', 'Ilmu Komunikasi']],
  ['PTSGN-POS-STAF-SEKPER-01', 'PTSGN-DIV-SEKPER', 3, false, 'Sekretariat & Hukum', ['D3', 'Kesekretariatan']],
  ['PTSGN-POS-DIRKEUSDM', 'PTSGN-DIR-KEUSDM', 1, true, 'Manajemen Eksekutif', ['S2', 'Akuntansi']],
  ['PTSGN-POS-KADIV-KEUANGAN', 'PTSGN-DIV-KEUANGAN', 2, true, 'Keuangan & Akuntansi', ['S2', 'Akuntansi']],
  ['PTSGN-POS-STAF-KEUANGAN-01', 'PTSGN-DIV-KEUANGAN', 3, false, 'Keuangan & Akuntansi', ['S1', 'Akuntansi']],
  ['PTSGN-POS-STAF-KEUANGAN-02', 'PTSGN-DIV-KEUANGAN', 3, false, 'Keuangan & Akuntansi', ['S1', 'Manajemen Keuangan']],
  ['PTSGN-POS-KADIV-SDM', 'PTSGN-DIV-SDM', 2, true, 'Sumber Daya Manusia', ['S2', 'Manajemen Sumber Daya Manusia']],
  ['PTSGN-POS-STAF-SDM-01', 'PTSGN-DIV-SDM', 3, false, 'Sumber Daya Manusia', ['S1', 'Psikologi']],
  ['PTSGN-POS-STAF-SDM-02', 'PTSGN-DIV-SDM', 3, false, 'Sumber Daya Manusia', ['S1', 'Manajemen Sumber Daya Manusia']],
  ['PTSGN-POS-DIRTEKOPS', 'PTSGN-DIR-TEKOPS', 1, true, 'Manajemen Eksekutif', ['S2', 'Teknik Kimia']],
  ['PTSGN-POS-KADIV-TI', 'PTSGN-DIV-TI', 2, true, 'Teknologi Informasi', ['S2', 'Teknik Informatika']],
  ['PTSGN-POS-KASUBDIV-INFRATI', 'PTSGN-SUBDIV-INFRATI', 3, true, 'Teknologi Informasi', ['S1', 'Teknik Informatika']],
  ['PTSGN-POS-STAF-INFRATI-01', 'PTSGN-SUBDIV-INFRATI', 4, false, 'Teknologi Informasi', ['S1', 'Sistem Informasi']],
  ['PTSGN-POS-STAF-TI-01', 'PTSGN-DIV-TI', 3, false, 'Teknologi Informasi', ['S1', 'Teknik Informatika']],
  ['PTSGN-POS-KADIV-OPSPROD', 'PTSGN-DIV-OPSPROD', 2, true, 'Produksi', ['S1', 'Teknik Kimia']],
  ['PTSGN-POS-KASUBDIV-RENPROD', 'PTSGN-SUBDIV-RENPROD', 3, true, 'Produksi', ['S1', 'Teknik Industri']],
  ['PTSGN-POS-STAF-RENPROD-01', 'PTSGN-SUBDIV-RENPROD', 4, false, 'Produksi', ['S1', 'Teknik Industri']],
  ['PTSGN-POS-STAF-OPSPROD-01', 'PTSGN-DIV-OPSPROD', 3, false, 'Produksi', ['S1', 'Teknik Kimia']],
  ['PTSGN-POS-STAF-OPSPROD-02', 'PTSGN-DIV-OPSPROD', 3, false, 'Pengendalian Mutu', ['S1', 'Teknologi Industri Pertanian']],
]
for (const [code, unit, level, head, fn, edu] of existing) positions.push({ code, unit, level, head, fn, edu, prov: pick(hoProv), age: head ? [46, 58] : [27, 42] })

for (const u of hoUnits) {
  const base = u.parent === 'PTSGN-DIV-SDM' ? 3 : 2
  units.push({ code: u.code, name: u.name, parent: u.parent, level: base })
  positions.push({ code: u.head.code, unit: u.code, level: base, head: true, fn: u.fn, edu: u.head.edu, parent: u.head.parent, prov: pick(hoProv), age: [44, 57], name: u.head.name })
  for (const s of u.staff) positions.push({ code: s.code, unit: u.code, level: base + 1, head: false, fn: u.fn, edu: s.edu, parent: u.head.code, prov: pick(hoProv), age: [26, 41], name: s.name })
}

for (const c of clusters) {
  const area = c.sumatra ? 'sumatra' : c.sulawesi ? 'sulawesi' : 'jawa'
  const ucode = `PTSGN-CL-${c.code}`
  units.push({ code: ucode, name: c.name, parent: 'PTSGN-DIR-TEKOPS', level: 2 })
  const hcode = `PTSGN-POS-${c.code}-HEAD`
  positions.push({ code: hcode, unit: ucode, level: 2, head: true, fn: 'Manajemen Eksekutif', edu: ['S1', 'Teknik Kimia'], parent: heads.dirTekOps, prov: c.pgs[0].prov, age: [50, 58], name: c.head, area })
  for (const mill of c.pgs) {
    const m = mill.k
    const pgCode = `PTSGN-PG-${m}`
    units.push({ code: pgCode, name: mill.name, parent: ucode, level: 3 })
    const gm = `PTSGN-POS-${m}-GM`
    positions.push({ code: gm, unit: pgCode, level: 3, head: true, fn: 'Manajemen Eksekutif', edu: ['S1', 'Teknik Kimia'], parent: hcode, prov: mill.prov, age: [48, 57], name: `General Manager ${mill.name}`, area })
    if (!mill.detailed) continue
    for (const b of bagian) {
      const bcode = `PTSGN-${m}-${b.key}`
      units.push({ code: bcode, name: `${b.unit} ${mill.name}`, parent: pgCode, level: 4 })
      const mgr = `PTSGN-POS-${m}-${b.key}-MGR`
      positions.push({ code: mgr, unit: bcode, level: 4, head: true, fn: b.fn, edu: b.edu, parent: gm, prov: mill.prov, age: [40, 55], name: `${b.mgr} ${mill.name}`, area })
      if (bigMills.has(m) && ['OLH', 'QA'].includes(b.key))
        positions.push({ code: `PTSGN-POS-${m}-${b.key}-AST`, unit: bcode, level: 5, head: false, fn: b.fn, edu: b.edu, parent: mgr, prov: mill.prov, age: [25, 40], name: `${b.asst} ${mill.name}`, area })
    }
  }
  c.kebun.forEach((kb, i) => {
    const kcode = `PTSGN-KB-${c.code}-${i + 1}`
    units.push({ code: kcode, name: kb, parent: ucode, level: 3 })
    positions.push({ code: `PTSGN-POS-KB-${c.code}-${i + 1}-MGR`, unit: kcode, level: 3, head: true, fn: 'Produksi', edu: ['S1', 'Agronomi'], parent: hcode, prov: c.pgs[0].prov, age: [42, 56], name: `Manajer ${kb}`, area })
  })
}

for (const u of lateUnits) {
  units.push({ code: u.code, name: u.name, parent: u.parent, level: 2 })
  positions.push({ code: u.head.code, unit: u.code, level: 2, head: true, fn: u.fn, edu: u.head.edu, parent: u.head.parent, prov: u.prov, age: [44, 57], name: u.head.name, late: true })
  for (const st of u.staff) positions.push({ code: st.code, unit: u.code, level: 3, head: false, fn: u.fn, edu: st.edu, parent: u.head.code, prov: u.prov, age: [26, 41], name: st.name, late: true })
}

// People: one per position.
const people = []
let n = 1000
const pad = (v, w = 2) => String(v).padStart(w, '0')
const kab = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '71', '72', '73', '74']
for (const p of positions) {
  const gender = rand() < 0.28 ? 'F' : 'M'
  const who = person(gender, p.area)
  const year = 2026 - between(...p.age)
  const month = between(1, 12)
  const day = between(1, 28)
  const dd = gender === 'F' ? day + 40 : day
  const nik = `${p.prov}${pick(kab)}${pad(between(1, 25))}${pad(dd)}${pad(month)}${pad(year % 100)}${pad(n - 999, 4)}`
  n += 1
  const start = `${between(2014, 2025)}-${pad(between(1, 12))}-01`
  const out = { employee_number: `PTSGN-${n}`, email: who.mail, name: who.full, nik, birth: `${year}-${pad(month)}-${pad(day)}`, position: p.code, unit: p.unit, head: p.head, parent: p.parent ?? null, fn: p.fn, edu: p.edu, start, gender }
  if (p.late) out.late = true
  people.push(out)
}

const sql = []
sql.push('-- Generated by seed/gen/directory.mjs; do not edit by hand. Idempotent: every row is keyed by its code or employee number.', 'BEGIN;')
for (const u of units) {
  sql.push(`INSERT INTO organization_units (id, unit_code, unit_name, parent_unit_id, instansi_id, level)
SELECT gen_random_uuid(), ${q(u.code)}, ${q(u.name)}, p.id, p.instansi_id, ${u.level} FROM organization_units p WHERE p.unit_code = ${q(u.parent)}
ON CONFLICT (unit_code) DO NOTHING;`)
}
for (const p of positions) {
  if (!p.name) continue
  sql.push(`INSERT INTO positions (id, position_code, position_name, position_level, unit_id, parent_position_id)
SELECT gen_random_uuid(), ${q(p.code)}, ${q(p.name)}, ${p.level}, u.id, (SELECT id FROM positions WHERE position_code = ${q(p.parent)})
FROM organization_units u WHERE u.unit_code = ${q(p.unit)} ON CONFLICT (position_code) DO NOTHING;`)
}
for (const x of people) {
  sql.push(`INSERT INTO users (id, employee_number, email, password_hash, full_name, is_active, nik, function_id, education_level, education_major, birth_date)
VALUES (gen_random_uuid(), ${q(x.employee_number)}, ${q(x.email)}, '', ${q(x.name)}, true, ${q(x.nik)}, (SELECT id FROM functions WHERE name = ${q(x.fn)}), ${q(x.edu[0])}, ${q(x.edu[1])}, ${q(x.birth)})
ON CONFLICT (employee_number) DO NOTHING;`)
  sql.push(`INSERT INTO user_assignments (id, user_id, unit_id, position_id, is_primary, is_department_head, start_date)
SELECT gen_random_uuid(), u.id, p.unit_id, p.id, true, ${x.head}, ${q(x.start)} FROM users u, positions p
WHERE u.employee_number = ${q(x.employee_number)} AND p.position_code = ${q(x.position)}
AND NOT EXISTS (SELECT 1 FROM user_assignments a WHERE a.user_id = u.id AND a.position_id = p.id);`)
}
sql.push('COMMIT;')
writeFileSync(new URL('../sql/10_directory.sql', import.meta.url), sql.join('\n') + '\n')
writeFileSync(new URL('../data/people.json', import.meta.url), JSON.stringify(people, null, 1) + '\n')
console.log(`units ${units.length}, positions ${positions.length}, people ${people.length}`)
