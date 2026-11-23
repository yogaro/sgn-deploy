// Fills the Beranda banner: the Sugartime trailer (video, with a poster cut from it) and three illustrated slides.
// Uploads through the media API and adds the slides through the admin API, as an L&D admin; safe to repeat (slides are matched by title).
// Usage: node seed/gen/banners.mjs [path/to/trailer.mp4]
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const root = new URL('../../', import.meta.url).pathname
const base = process.env.LMS_BASE ?? 'http://127.0.0.1:3003'
const password = process.env.DEMO_PASSWORD ?? 'Demo#Sgn2026'
const trailer = process.argv[2] ?? `${root}Trailer Sugartime.mp4`
const out = `${root}seed/assets/banners/`
mkdirSync(out, { recursive: true })

const slides = [
  { key: 'trailer', kind: 'VIDEO', title: 'SUGARTIME: Transforming Knowledge into Capability', eyebrow: 'Trailer', caption: 'Kenali SUGARLedge, ruang belajar insan Sinergi Gula Nusantara.', link: '/lms/katalog' },
  { key: 'welcome', kind: 'IMAGE', title: 'Tumbuhkan kapabilitas, panen hasil yang manis', eyebrow: 'Selamat datang', caption: 'Belajar sedikit demi sedikit, seperti tebu yang tumbuh tiap musim.', hue: 150, motif: 'cane', link: '/lms/saya' },
  { key: 'courses', kind: 'IMAGE', title: 'Dari bibit sampai panen, satu jalur belajar', eyebrow: 'Sorotan kursus', caption: 'Pilih kursus yang sesuai jabatan dan kompetensi Anda.', hue: 205, motif: 'path', link: '/lms/learning-path' },
  { key: 'knowledge', kind: 'IMAGE', title: 'Ilmu yang manis, dibagi supaya terus tumbuh', eyebrow: 'Knowledge Hub', caption: 'Baca artikel dan dokumen dari rekan-rekan SGN.', hue: 28, motif: 'book', link: '/lms/knowledge-hub' },
]

const motifs = {
  cane: '<g stroke="currentColor" stroke-width="22" stroke-linecap="round"><path d="M120 360V90M200 360V50M280 360V110"/></g><path d="M120 90C80 70 60 40 40 30c30 0 70 10 80 60zM200 50C170 30 160 10 150 0c30 5 50 20 50 50zM280 110c30-20 60-30 90-30-20 25-50 40-90 30z"/>',
  path: '<g fill="none" stroke="currentColor" stroke-width="22" stroke-linecap="round"><path d="M60 330C140 330 120 220 200 220s60-110 140-110"/></g><circle cx="60" cy="330" r="26"/><circle cx="200" cy="220" r="26"/><circle cx="340" cy="110" r="26"/>',
  book: '<path d="M50 70h130c15 0 20 10 20 20v250c0-10-5-20-20-20H50zM350 70H220c-15 0-20 10-20 20v250c0-10 5-20 20-20h130z"/>',
}

async function login() {
  for (let i = 0; i < 20; i++) {
    const r = await fetch(`${base}/api/iam/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ login_id: process.env.SEED_ADMIN_LOGIN ?? 'ADMIN-LMS', password }) })
    if (r.ok) return (await r.json()).access_token
    if (r.status !== 429) throw new Error(`login ${r.status}`)
    await new Promise((res) => setTimeout(res, 5000))
  }
  throw new Error('rate limited')
}
let token = await login()
const api = (path, init = {}) => fetch(`${base}/api/lms/v1${path}`, { ...init, headers: { ...init.headers, authorization: `Bearer ${token}`, 'content-type': 'application/json' } })

async function upload(file, kind, type, name) {
  const bytes = readFileSync(file)
  const t = await api('/media/uploads', { method: 'POST', body: JSON.stringify({ kind, file_name: name, content_type: type, size_bytes: bytes.length }) })
  if (t.status !== 201) throw new Error(`${name}: ticket ${t.status} ${await t.text()}`)
  const ticket = await t.json()
  const put = await fetch(ticket.upload_url, { method: 'PUT', headers: ticket.headers, body: bytes })
  if (!put.ok) throw new Error(`${name}: put ${put.status}`)
  const c = await api(`/media/${ticket.media_id}/complete`, { method: 'POST' })
  if (c.status !== 200) throw new Error(`${name}: complete ${c.status} ${await c.text()}`)
  return ticket.media_id
}

const existing = new Set(((await (await api('/admin/banners')).json()).items ?? []).map((b) => b.title))
const todo = slides.filter((s) => !existing.has(s.title))
if (!todo.length) {
  console.log('banners: already there')
  process.exit(0)
}

if (todo.some((s) => s.kind === 'IMAGE')) {
  const { chromium } = createRequire(`${root}sgn-lms-fe/package.json`)('playwright')
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1600, height: 700 } })
  for (const s of todo.filter((x) => x.kind === 'IMAGE')) {
    const file = `${out}${s.key}.jpg`
    if (!existsSync(file)) {
      await page.setContent(`<html><body style="margin:0;width:1600px;height:700px;background:linear-gradient(120deg,hsl(${s.hue} 55% 18%),hsl(${(s.hue + 30) % 360} 60% 34%));position:relative;overflow:hidden;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#fff">
<svg viewBox="0 0 400 400" width="760" height="760" fill="#fff" color="#fff" style="position:absolute;right:-40px;top:-30px;opacity:.16">${motifs[s.motif]}</svg>
<div style="position:absolute;left:0;top:0;width:100%;height:100%;background:radial-gradient(circle at 85% 20%,rgba(252,211,77,.22),transparent 40%)"></div></body></html>`)
      await page.screenshot({ path: file, type: 'jpeg', quality: 82 })
    }
  }
  await browser.close()
}

let order = 0
for (const s of slides) {
  order += 1
  if (existing.has(s.title)) continue
  let mediaId, posterId = null
  if (s.kind === 'VIDEO') {
    if (!existsSync(trailer)) throw new Error(`trailer not found: ${trailer}`)
    const poster = `${out}trailer-poster.jpg`
    if (!existsSync(poster)) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '3', '-i', trailer, '-frames:v', '1', '-q:v', '3', poster])
    mediaId = await upload(trailer, 'VIDEO', 'video/mp4', 'demo-banner-trailer-sugartime.mp4')
    posterId = await upload(poster, 'IMAGE', 'image/jpeg', 'demo-banner-trailer-poster.jpg')
  } else {
    mediaId = await upload(`${out}${s.key}.jpg`, 'IMAGE', 'image/jpeg', `demo-banner-${s.key}.jpg`)
  }
  const body = { kind: s.kind, media_id: mediaId, poster_media_id: posterId, title: s.title, eyebrow: s.eyebrow, caption: s.caption, link_url: s.link, display_seconds: s.kind === 'IMAGE' ? 6 : null, is_active: true }
  const r = await api('/admin/banners', { method: 'POST', body: JSON.stringify(body) })
  if (r.status !== 201) throw new Error(`${s.title}: ${r.status} ${await r.text()}`)
  console.log(`banner added: ${s.title}`)
}
// Put the trailer first, whatever order the slides were added in.
const all = (await (await api('/admin/banners')).json()).items
const rank = (b) => slides.findIndex((s) => s.title === b.title)
const ids = [...all].sort((a, b) => (rank(a) < 0 ? 99 : rank(a)) - (rank(b) < 0 ? 99 : rank(b)) || a.id - b.id).map((b) => b.id)
const o = await api('/admin/banners/order', { method: 'PUT', body: JSON.stringify({ ids }) })
if (o.status !== 200) throw new Error(`order ${o.status}`)
writeFileSync(`${out}done.txt`, new Date().toISOString())
console.log(`banners: ${ids.length} slides in order`)
