// Generates seed/sql/10_directory.sql from the real staff list (seed/data/private/formasi.json, made by formasi-import.mjs),
// replacing the made-up demo organisation (seed/gen/directory.mjs keeps building that one).
// - Mills (PG), estates (Kebun) and clusters reuse the units already in Directory, matched through the explicit table below;
//   their cluster parents come from the PO's list and are never guessed from a place name.
// - Head-office units hang under a new "Head Office SGN"; head office and the clusters hang under one root unit.
// - One position per unit and job title; the unit's head is the lowest-level holder of a head title, else none.
// - Every made-up PTSGN unit, position and person not used here is switched off (is_active = false), not deleted.
// - One made-up account per pilot unit ("Peserta Demo SPI", "Peserta Demo Tekpol", ...) for recording the demo without
//   showing a real name; each holds a staff post of its unit, so it receives that unit's pilot modules.
// Run: node seed/gen/directory-formasi.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const here = new URL('..', import.meta.url).pathname
const staff = JSON.parse(readFileSync(`${here}data/private/formasi.json`, 'utf8'))
const q = (s) => (s == null ? 'NULL' : `'${String(s).replaceAll("'", "''")}'`)

const ROOT = 'PTSGN-ROOT', HO = 'PTSGN-HO'
// FORMASI unit name -> existing Directory unit code (mills, estates, clusters).
const existing = {
  'Cluster Sulawesi': 'PTSGN-CL-SUL', 'Cluster Sumatera 1': 'PTSGN-CL-SUM1', 'Cluster Sumatera 2': 'PTSGN-CL-SUM2',
  'PG Assembagoes': 'PTSGN-PG-ASEM', 'PG Bone': 'PTSGN-PG-BONE', 'PG Bunga Mayang': 'PTSGN-PG-BUMA', 'PG Camming': 'PTSGN-PG-CAMM',
  'PG Cinta Manis': 'PTSGN-PG-CIMA', 'PG Djatiroto': 'PTSGN-PG-DJAT', 'PG Djombang Baru': 'PTSGN-PG-DJOM', 'PG Gempolkrep': 'PTSGN-PG-GEMP',
  'PG Gending': 'PTSGN-PG-GEND', 'PG Glenmore': 'PTSGN-PG-GLEN', 'PG Kedawoeng': 'PTSGN-PG-KEDA', 'PG Kremboong': 'PTSGN-PG-KREM',
  'PG Kwala Madu': 'PTSGN-PG-KWMD', 'PG Lestari': 'PTSGN-PG-LEST', 'PG Meritjan': 'PTSGN-PG-MERI', 'PG Modjopanggoong': 'PTSGN-PG-MODJ',
  'PG Mojo': 'PTSGN-PG-MOJO', 'PG Ngadiredjo': 'PTSGN-PG-NGAD', 'PG Pagottan': 'PTSGN-PG-PAGO', 'PG Pandjie': 'PTSGN-PG-PAND',
  'PG Pangka': 'PTSGN-PG-PANG', 'PG Pesantren Baru': 'PTSGN-PG-PEBA', 'PG Poerwodadie': 'PTSGN-PG-POER', 'PG Pradjekan': 'PTSGN-PG-PRAD',
  'PG Redjosarie': 'PTSGN-PG-REDJ', 'PG Rendeng': 'PTSGN-PG-REND', 'PG Sei Semayang': 'PTSGN-PG-SESM', 'PG Semboro': 'PTSGN-PG-SEMB',
  'PG Soedhono': 'PTSGN-PG-SOED', 'PG Sragi': 'PTSGN-PG-SRAG', 'PG Takalar': 'PTSGN-PG-TAKA', 'PG Tjoekir': 'PTSGN-PG-TJOE',
  'PG Wonolangan': 'PTSGN-PG-WONO', 'PG Wringinanom': 'PTSGN-PG-WRIN',
  'Kebun Agroforestry': 'PTSGN-KB-JT2-1', 'Kebun Banyuwangi Raya': 'PTSGN-KB-JT4-2', 'Kebun Bone': 'PTSGN-KB-SUL-1',
  'Kebun Bunga Mayang': 'PTSGN-KB-SUM2-1', 'Kebun Camming': 'PTSGN-KB-SUL-2', 'Kebun Cinta Manis 1': 'PTSGN-KB-SUM2-2',
  'Kebun Cinta Manis 2': 'PTSGN-KB-SUM2-3', 'Kebun Dhoho': 'PTSGN-KB-JT1-1', 'Kebun Jateng': 'PTSGN-KB-JWB-1',
  'Kebun Kalitelepak': 'PTSGN-KB-JT4-3', 'Kebun Kwala Madu': 'PTSGN-KB-SUM1-1', 'Kebun Lumajang Raya': 'PTSGN-KB-JT3-1',
  'Kebun Mumbul': 'PTSGN-KB-JT4-1', 'Kebun Sei Semayang': 'PTSGN-KB-SUM1-2', 'Kebun Takalar': 'PTSGN-KB-SUL-3',
}
const clusters = ['PTSGN-CL-JT1', 'PTSGN-CL-JT2', 'PTSGN-CL-JT3', 'PTSGN-CL-JT4', 'PTSGN-CL-JWB', 'PTSGN-CL-SUL', 'PTSGN-CL-SUM1', 'PTSGN-CL-SUM2']
// Head-office units: FORMASI name -> [code, shown name, parent]. Names drop the "HO SGN - " prefix only.
const MKSO = 'PTSGN-HO-MKSO'
const headOffice = {
  'HO SGN - BOC': ['PTSGN-HO-BOC', 'BOC'], 'HO SGN - BOD': ['PTSGN-HO-BOD', 'BOD'], 'HO SGN - BOM': ['PTSGN-HO-BOM', 'BOM'],
  'HO SGN - Organ Dekom': ['PTSGN-HO-DEKOM', 'Organ Dekom'], 'HO SGN - Di Luar Nomenklatur': ['PTSGN-HO-DLN', 'Di Luar Nomenklatur'],
  'HO SGN - PMO': ['PTSGN-HO-PMO', 'PMO'], 'HO SGN - Project Management': ['PTSGN-HO-PM', 'Project Management'],
  'HO SGN - Divisi Akuntansi & Perpajakan': ['PTSGN-HO-AKP', 'Divisi Akuntansi & Perpajakan'],
  'HO SGN - Divisi Hubungan Kelembagaan & Hukum': ['PTSGN-HO-HKH', 'Divisi Hubungan Kelembagaan & Hukum'],
  'HO SGN - Divisi Manajemen Risiko': ['PTSGN-HO-MR', 'Divisi Manajemen Risiko'],
  'HO SGN - Divisi Operasional SDM': ['PTSGN-HO-OSDM', 'Divisi Operasional SDM'],
  'HO SGN - Divisi Pemasaran & Pelanggan': ['PTSGN-HO-PMP', 'Divisi Pemasaran & Pelanggan'],
  'HO SGN - Divisi Penelitian & Pengembangan': ['PTSGN-HO-LITBANG', 'Divisi Penelitian & Pengembangan'],
  'HO SGN - Divisi Pengadaan': ['PTSGN-HO-PENGADAAN', 'Divisi Pengadaan'],
  'HO SGN - Divisi Pengembangan SDM & Budaya': ['PTSGN-HO-PSDMB', 'Divisi Pengembangan SDM & Budaya'],
  'HO SGN - Divisi Perbendaharaan & Anggaran': ['PTSGN-HO-PA', 'Divisi Perbendaharaan & Anggaran'],
  'HO SGN - Divisi Quality Assurance': ['PTSGN-HO-QA', 'Divisi Quality Assurance'],
  'HO SGN - Divisi Satuan Pengawasan Intern': ['PTSGN-HO-SPI', 'Divisi Satuan Pengawasan Intern'],
  'HO SGN - Divisi Sekretariat Perusahaan': ['PTSGN-HO-SEKPER', 'Divisi Sekretariat Perusahaan'],
  'HO SGN - Divisi Strategi Bisnis & Manajemen Portofolio': ['PTSGN-HO-SBMP', 'Divisi Strategi Bisnis & Manajemen Portofolio'],
  'HO SGN - Divisi Tanaman': ['PTSGN-HO-TANAMAN', 'Divisi Tanaman'],
  'HO SGN - Divisi Tebu Rakyat': ['PTSGN-HO-TR', 'Divisi Tebu Rakyat'],
  'HO SGN - Divisi Teknik & Pengolahan': ['PTSGN-HO-TEKPOL', 'Divisi Teknik & Pengolahan'],
  'HO SGN - Divisi Teknologi Informasi': ['PTSGN-HO-TI', 'Divisi Teknologi Informasi'],
  'HO MKSO - Bagian Business Support': ['PTSGN-HO-MKSO-BS', 'Bagian Business Support', MKSO],
  'HO MKSO - Bagian Operasional': ['PTSGN-HO-MKSO-OPS', 'Bagian Operasional', MKSO],
  'HO MKSO - Bagian Operasional 1': ['PTSGN-HO-MKSO-OPS1', 'Bagian Operasional 1', MKSO],
  'HO MKSO - Bagian Operasional 2': ['PTSGN-HO-MKSO-OPS2', 'Bagian Operasional 2', MKSO],
  Puslit: ['PTSGN-HO-PUSLIT', 'Puslit'],
  'PLFP 2026': ['PTSGN-HO-PLFP', 'PLFP 2026'],
}
// A head title, in the order they win when one unit holds several at the same level.
const HEAD = /^(?:(?:Plt|Pjs|Plh)\.?\s*)?(?:Direktur Utama|Komisaris Utama|General Manager|Kadiv|Kepala Divisi|Kepala Bagian|Kabag|Kasubag)\b/i
const levelOf = (l) => (l === 'BOC' || l === 'BOD' || l === 'BOM' ? 1 : /^BOD-(\d)$/.test(l ?? '') ? Number(l.slice(4)) + 1 : 8)
// rank orders holders within a unit: commissioners first, then directors, then BOD-1 downwards.
const rank = (l) => (l == null ? 99 : l === 'BOC' ? 0 : levelOf(l))

// Units
const units = [] // {code, name, parent, level}
units.push({ code: ROOT, name: 'PT Sinergi Gula Nusantara', parent: null, level: 1 })
units.push({ code: HO, name: 'Head Office SGN', parent: ROOT, level: 2 })
units.push({ code: MKSO, name: 'HO MKSO', parent: HO, level: 3 })
for (const [, [code, name, parent]] of Object.entries(headOffice)) units.push({ code, name, parent: parent ?? HO, level: parent ? 4 : 3 })
const unitCode = (name) => existing[name] ?? headOffice[name]?.[0]
const missing = [...new Set(staff.map((s) => s.unit))].filter((u) => !unitCode(u))
if (missing.length) throw new Error(`units without a match: ${missing.join(', ')}`)
const usedUnits = new Set([ROOT, HO, MKSO, ...clusters, ...Object.values(headOffice).map((h) => h[0]), ...Object.values(existing)])

// Positions: one per unit and title, ordered by level then title so codes stay the same between runs.
const byUnit = new Map()
for (const s of staff) {
  const code = unitCode(s.unit)
  if (!byUnit.has(code)) byUnit.set(code, [])
  byUnit.get(code).push(s)
}
const positions = [] // {code, name, unit, level, head}
const positionOf = new Map() // `${unit}|${title}` -> position
const heads = new Map() // unit -> pn
for (const [unit, people] of [...byUnit].sort(([a], [b]) => a.localeCompare(b))) {
  const titles = new Map()
  for (const s of people) {
    const t = titles.get(s.position)
    if (!t || rank(s.level) < rank(t.level)) titles.set(s.position, { title: s.position, level: s.level })
  }
  const sorted = [...titles.values()].sort((a, b) => rank(a.level) - rank(b.level) || a.title.localeCompare(b.title, 'id'))
  const head = people.filter((s) => HEAD.test(s.position)).sort((a, b) => rank(a.level) - rank(b.level) || a.pn.localeCompare(b.pn))[0]
  if (head) heads.set(unit, head.pn)
  const short = unit.replace(/^PTSGN-/, '')
  sorted.forEach((t, i) => {
    const p = { code: `PTSGN-POS-${short}-${String(i + 1).padStart(3, '0')}`, name: t.title.slice(0, 100), unit, level: levelOf(t.level), head: head?.position === t.title }
    positions.push(p)
    positionOf.set(`${unit}|${t.title}`, p)
  })
}
const headPosition = new Map(positions.filter((p) => p.head).map((p) => [p.unit, p]))

// The demo accounts: [number, name, email, unit, job title]. SPI's takes the unit's most common non-head post.
const spi = 'PTSGN-HO-SPI'
const spiTitles = (byUnit.get(spi) ?? []).filter((s) => !HEAD.test(s.position)).map((s) => s.position)
const spiTitle = [...new Set(spiTitles)].sort((a, b) => spiTitles.filter((t) => t === b).length - spiTitles.filter((t) => t === a).length || a.localeCompare(b))[0]
const demos = [
  ['DEMO-SPI-01', 'Peserta Demo SPI', 'demo.spi@sgn.example', spi, spiTitle],
  ['DEMO-TEKPOL-01', 'Peserta Demo Tekpol', 'demo.tekpol@sgn.example', 'PTSGN-HO-TEKPOL', 'Asisten Masakan'],
  ['DEMO-SEKPER-01', 'Peserta Demo Sekper', 'demo.sekper@sgn.example', 'PTSGN-HO-SEKPER', 'Asisten Kesekretariatan'],
  ['DEMO-K3-01', 'Peserta Demo K3', 'demo.k3@sgn.example', 'PTSGN-HO-TEKPOL', 'Asisten K3'],
  ['DEMO-TANAMAN-01', 'Peserta Demo Tanaman', 'demo.tanaman@sgn.example', 'PTSGN-HO-TANAMAN', 'Asisten Budidaya'],
  ['DEMO-SDM-01', 'Peserta Demo SDM', 'demo.sdm@sgn.example', 'PTSGN-HO-PSDMB', 'Asisten Manajemen Karir'],
  ['DEMO-LITBANG-01', 'Peserta Demo Litbang', 'demo.litbang@sgn.example', 'PTSGN-HO-LITBANG', 'Asisten Penelitian'],
].map(([pn, name, email, unit, title]) => {
  const position = positionOf.get(`${unit}|${title}`)
  if (!position) throw new Error(`no position "${title}" in ${unit}`)
  return { pn, name, email, position, head: false }
})

const sql = ['-- Generated by seed/gen/directory-formasi.mjs from FORMASI; do not edit by hand. Idempotent.', 'BEGIN;']
// Switch off the made-up organisation first; the rows below switch the reused ones back on.
sql.push(`UPDATE organization_units SET is_active = false WHERE unit_code LIKE 'PTSGN-%' AND unit_code NOT IN (${[...usedUnits].map(q).join(', ')});`)
sql.push(`UPDATE positions SET is_active = false WHERE position_code LIKE 'PTSGN-POS-%';`)
sql.push(`UPDATE users SET is_active = false WHERE employee_number LIKE 'PTSGN-%';`)
// People an earlier import took in without a name (the sheet left Nama empty) are switched off until SDM fills it in.
sql.push(`UPDATE users SET is_active = false WHERE employee_number ~ '^[0-9]+$' AND btrim(full_name) = '';`)
const instansi = `(SELECT id FROM instansi WHERE instansi_code = 'SGN0')`
for (const u of units) {
  sql.push(`INSERT INTO organization_units (id, unit_code, unit_name, parent_unit_id, instansi_id, level)
VALUES (gen_random_uuid(), ${q(u.code)}, ${q(u.name)}, (SELECT id FROM organization_units WHERE unit_code = ${q(u.parent)}), ${instansi}, ${u.level})
ON CONFLICT (unit_code) DO UPDATE SET unit_name = EXCLUDED.unit_name, parent_unit_id = EXCLUDED.parent_unit_id, level = EXCLUDED.level, is_active = true;`)
}
sql.push(`UPDATE organization_units SET parent_unit_id = (SELECT id FROM organization_units WHERE unit_code = ${q(ROOT)}), level = 2, is_active = true WHERE unit_code IN (${clusters.map(q).join(', ')});`)
sql.push(`UPDATE organization_units SET is_active = true WHERE unit_code IN (${Object.values(existing).map(q).join(', ')});`)

// Positions go through a temp table: thousands of rows, one statement.
sql.push('CREATE TEMP TABLE fp (code text, name text, unit text, level int, parent text);')
const parentOf = (p) => (p.head ? null : headPosition.get(p.unit)?.code ?? null)
for (let i = 0; i < positions.length; i += 500) {
  sql.push(`INSERT INTO fp VALUES\n${positions.slice(i, i + 500).map((p) => `(${q(p.code)}, ${q(p.name)}, ${q(p.unit)}, ${p.level}, ${q(parentOf(p))})`).join(',\n')};`)
}
sql.push(`INSERT INTO positions (id, position_code, position_name, position_level, unit_id)
SELECT gen_random_uuid(), fp.code, fp.name, fp.level, u.id FROM fp JOIN organization_units u ON u.unit_code = fp.unit
ON CONFLICT (position_code) DO UPDATE SET position_name = EXCLUDED.position_name, position_level = EXCLUDED.position_level, unit_id = EXCLUDED.unit_id, is_active = true;`)
sql.push(`UPDATE positions p SET parent_position_id = pp.id FROM fp JOIN positions pp ON pp.position_code = fp.parent WHERE p.position_code = fp.code;`)
sql.push(`UPDATE positions p SET parent_position_id = NULL FROM fp WHERE p.position_code = fp.code AND fp.parent IS NULL;`)

// People and their one primary assignment.
sql.push('CREATE TEMP TABLE fu (pn text, name text, email text, pos text, head boolean);')
const people = [...staff.map((s) => ({ pn: s.pn, name: s.name, email: `${s.pn}@sgn.example`, position: positionOf.get(`${unitCode(s.unit)}|${s.position}`), head: heads.get(unitCode(s.unit)) === s.pn })), ...demos]
for (let i = 0; i < people.length; i += 1000) {
  sql.push(`INSERT INTO fu VALUES\n${people.slice(i, i + 1000).map((p) => `(${q(p.pn)}, ${q(p.name)}, ${q(p.email)}, ${q(p.position.code)}, ${p.head})`).join(',\n')};`)
}
sql.push(`INSERT INTO users (id, employee_number, email, password_hash, full_name, is_active)
SELECT gen_random_uuid(), pn, email, '', name, true FROM fu
ON CONFLICT (employee_number) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, is_active = true;`)
sql.push(`DELETE FROM user_assignments a USING users u, fu WHERE a.user_id = u.id AND u.employee_number = fu.pn
AND a.position_id <> (SELECT id FROM positions WHERE position_code = fu.pos);`)
sql.push(`INSERT INTO user_assignments (id, user_id, unit_id, position_id, is_primary, is_department_head, start_date)
SELECT gen_random_uuid(), u.id, p.unit_id, p.id, true, fu.head, DATE '2026-01-01' FROM fu
JOIN users u ON u.employee_number = fu.pn JOIN positions p ON p.position_code = fu.pos
WHERE NOT EXISTS (SELECT 1 FROM user_assignments a WHERE a.user_id = u.id AND a.position_id = p.id);`)
sql.push(`UPDATE user_assignments a SET is_department_head = fu.head FROM users u, fu WHERE a.user_id = u.id AND u.employee_number = fu.pn;`)
sql.push('COMMIT;')
writeFileSync(`${here}sql/10_directory.sql`, `${sql.join('\n')}\n`)
writeFileSync(`${here}data/private/positions.json`, `${JSON.stringify(positions)}\n`)
writeFileSync(`${here}data/private/people.json`, `${JSON.stringify(people.map((p) => ({ pn: p.pn, email: p.email, position: p.position.code, unit: p.position.unit, head: p.head })))}\n`)
const headless = [...byUnit.keys()].filter((u) => !heads.has(u))
console.log(`units ${units.length} new + ${Object.keys(existing).length} reused, positions ${positions.length}, people ${people.length} (with ${demos.length} demo accounts), units with a head ${heads.size}, without ${headless.length}`)
for (const d of demos) console.log(`  ${d.email} in ${d.position.code} "${d.position.name}"`)
