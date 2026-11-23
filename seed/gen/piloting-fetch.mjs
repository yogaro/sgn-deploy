// Downloads the PSDM pilot modules from Google Drive into seed/assets/piloting/<code>.<ext> and writes fetch.json with what
// came back. Only links shared with "anyone with the link" work; a sign-in page or any other HTML is reported, never saved.
// Slides links are exported to PDF; a row marked `sameAs` is skipped. Files already on disk are kept. Run: node seed/gen/piloting-fetch.mjs
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { pilotUnits } from '../data/piloting.mjs'

const dir = new URL('../assets/piloting/', import.meta.url).pathname
mkdirSync(dir, { recursive: true })

const fileUrl = (id) => `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`
const slidesUrl = (id) => `https://docs.google.com/presentation/d/${id}/export/pdf`

// kindOf names a download by its first bytes: a PDF, an Office file (zip), or something else (usually a sign-in page).
function kindOf(bytes) {
  const head = bytes.subarray(0, 5).toString('latin1')
  if (head.startsWith('%PDF')) return 'pdf'
  if (head.startsWith('PK')) return 'office'
  return 'other'
}

async function get(url) {
  const r = await fetch(url, { redirect: 'follow' })
  const bytes = Buffer.from(await r.arrayBuffer())
  const name = /filename="([^"]+)"/.exec(r.headers.get('content-disposition') ?? '')?.[1] ?? null
  return { status: r.status, bytes, name }
}

const report = []
for (const unit of pilotUnits) {
  for (const m of unit.modules) {
    const entry = { code: m.code, title: m.title }
    if (m.sameAs) {
      report.push({ ...entry, result: 'same', note: `Berkasnya sama dengan ${m.sameAs}.` })
      continue
    }
    const done = ['pdf', 'pptx', 'docx'].map((ext) => `${m.code}.${ext}`).find((f) => existsSync(dir + f))
    if (done) {
      report.push({ ...entry, result: 'kept', file: done, bytes: statSync(dir + done).size })
      continue
    }
    try {
      let res = m.slides ? await get(slidesUrl(m.slides)) : await get(fileUrl(m.file))
      // An Office file opened in Slides may refuse the export; its original then comes through the file link.
      if (m.slides && (res.status !== 200 || kindOf(res.bytes) === 'other')) res = await get(fileUrl(m.slides))
      const kind = res.status === 200 ? kindOf(res.bytes) : 'other'
      if (kind === 'other') {
        report.push({ ...entry, result: 'failed', note: `HTTP ${res.status}; bukan berkas (kemungkinan tidak dibagikan untuk umum).` })
        console.log(`x ${m.code} HTTP ${res.status}`)
        continue
      }
      const ext = kind === 'pdf' ? 'pdf' : /\.docx$/i.test(res.name ?? '') ? 'docx' : 'pptx'
      writeFileSync(`${dir}${m.code}.${ext}`, res.bytes)
      report.push({ ...entry, result: 'saved', file: `${m.code}.${ext}`, bytes: res.bytes.length, source_name: res.name })
      console.log(`  ${m.code}.${ext} ${(res.bytes.length / 1048576).toFixed(1)} MB  ${res.name ?? ''}`)
    } catch (e) {
      report.push({ ...entry, result: 'failed', note: String(e.message ?? e) })
      console.log(`x ${m.code} ${e.message}`)
    }
  }
}
writeFileSync(`${dir}fetch.json`, `${JSON.stringify(report, null, 1)}\n`)
const total = report.reduce((n, r) => n + (r.bytes ?? 0), 0)
const count = (k) => report.filter((r) => r.result === k).length
console.log(`saved ${count('saved')}, kept ${count('kept')}, failed ${count('failed')}, same file ${count('same')}, ${(total / 1048576).toFixed(1)} MB in all`)
