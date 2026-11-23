// Reads the FORMASI sheet of the PSDM workbook (real SGN staff list) into seed/data/private/formasi.json, which the
// FORMASI seed builds the organisation from. The folder is git-ignored: the file holds real names.
// Reads the .xlsx with `unzip -p`, so it needs no spreadsheet library. Prints counts only, never names.
// Run: node seed/gen/formasi-import.mjs /path/to/Piloting.xlsx
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const xlsx = process.argv[2]
if (!xlsx) throw new Error('usage: node seed/gen/formasi-import.mjs <workbook.xlsx>')
const unzip = (part) => execFileSync('unzip', ['-p', xlsx, part], { encoding: 'utf8', maxBuffer: 1 << 30 })
const unescape = (s) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')

const shared = [...unzip('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map(([, si]) =>
  unescape([...si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')),
)
const book = unzip('xl/workbook.xml')
const rels = unzip('xl/_rels/workbook.xml.rels')
const rid = /<sheet [^>]*name="FORMASI"[^>]*r:id="([^"]+)"/.exec(book)?.[1]
const target = new RegExp(`Id="${rid}"[^>]*Target="([^"]+)"`).exec(rels)?.[1]
if (!target) throw new Error('sheet FORMASI not found')
const sheet = unzip(`xl/${target.replace(/^\/?xl\//, '')}`)

const columns = { A: 'pn', B: 'name', C: 'position', D: 'unit', E: 'level', F: 'status', G: 'gender' }
const rows = []
for (const [, body] of sheet.matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)) {
  const row = {}
  for (const [, col, attrs, inner] of body.matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const v = /<v>([\s\S]*?)<\/v>/.exec(inner ?? '')?.[1]
    if (v != null && columns[col]) row[columns[col]] = (attrs.includes('t="s"') ? shared[Number(v)] : unescape(v)).trim()
  }
  rows.push(row)
}
rows.shift() // header

const PLACEHOLDER = /^Integration: default position$/i
const seen = new Set()
const people = []
let blank = 0, duplicate = 0, noPosition = 0
const nameless = []
for (const r of rows) {
  if (!r.pn) { blank += 1; continue }
  // Excel keeps most PNs as numbers, often written as 1.0000001E7; turn every numeric one back into plain digits.
  const pn = /^\d+(\.\d+)?(E[+-]?\d+)?$/i.test(r.pn) ? String(Math.round(Number(r.pn))) : r.pn
  if (seen.has(pn)) { duplicate += 1; continue }
  seen.add(pn)
  // A row without a name cannot be shown or signed in as; SDM completes it in the sheet, and the next import takes it in.
  if (!r.name) { nameless.push(pn); continue }
  let position = r.position ?? ''
  if (!position || PLACEHOLDER.test(position)) { noPosition += 1; position = 'Jabatan belum ditetapkan' }
  people.push({ pn, name: r.name ?? '', position, unit: r.unit ?? '', level: r.level ?? null, status: r.status ?? null, gender: r.gender ?? null })
}

const dir = new URL('../data/private/', import.meta.url).pathname
mkdirSync(dir, { recursive: true })
writeFileSync(`${dir}formasi.json`, `${JSON.stringify(people)}\n`)
const units = new Set(people.map((p) => p.unit))
const pairs = new Set(people.map((p) => `${p.unit}|${p.position}`))
console.log(`rows ${rows.length}: kept ${people.length}, blank ${blank}, duplicate NIK ${duplicate}, no name ${nameless.length}, no position ${noPosition}; units ${units.size}, unit+position pairs ${pairs.size}`)
if (nameless.length) console.log(`no name (left out, NIK only): ${nameless.join(', ')}`)
