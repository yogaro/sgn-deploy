// Builds the demo's media into seed/assets: cover and slide images (Playwright), PDF handouts (Playwright), videos (ffmpeg).
// Everything is generated illustration; nothing is copied from the web. Run: node seed/gen/assets.mjs
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { elearning } from '../data/catalog.mjs'
import { articles } from '../data/knowledge.mjs'
import { onsite } from '../data/onsite.mjs'
import { pilotUnits } from '../data/piloting.mjs'

const root = new URL('..', import.meta.url).pathname
const out = `${root}assets/`
mkdirSync(out, { recursive: true })
const require = createRequire(`${root}../sgn-lms-fe/package.json`)
const { chromium } = require('playwright')

const motifs = {
  factory: '<path d="M30 330V190l70 40v-40l70 40v-40l70 40V90h50v240z" /><rect x="262" y="40" width="30" height="60" rx="4"/><circle cx="300" cy="22" r="14" opacity=".6"/>',
  lab: '<path d="M150 40h100v90l70 150a30 30 0 0 1-27 43H107a30 30 0 0 1-27-43l70-150z"/><rect x="140" y="30" width="120" height="16" rx="6"/>',
  gear: '<circle cx="200" cy="200" r="70" fill="none" stroke-width="40" stroke="currentColor"/><g stroke="currentColor" stroke-width="36" stroke-linecap="round"><path d="M200 40v40M200 320v40M40 200h40M320 200h40M87 87l28 28M285 285l28 28M313 87l-28 28M115 285l-28 28"/></g>',
  cane: '<g stroke="currentColor" stroke-width="22" stroke-linecap="round"><path d="M120 360V90M200 360V50M280 360V110"/></g><path d="M120 90C80 70 60 40 40 30c30 0 70 10 80 60zM200 50C170 30 160 10 150 0c30 5 50 20 50 50zM280 110c30-20 60-30 90-30-20 25-50 40-90 30z"/>',
  shield: '<path d="M200 30l140 50v110c0 90-60 150-140 180C120 340 60 280 60 190V80z"/><path d="M135 195l50 50 85-100" fill="none" stroke="#fff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>',
  leaf: '<path d="M60 320C60 160 160 60 340 50c0 160-90 270-240 280z"/><path d="M80 320c60-100 120-160 200-210" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".7"/>',
  chain: '<g fill="none" stroke="currentColor" stroke-width="30"><rect x="40" y="130" width="170" height="90" rx="45"/><rect x="190" y="180" width="170" height="90" rx="45"/></g>',
  magnify: '<circle cx="170" cy="170" r="105" fill="none" stroke="currentColor" stroke-width="34"/><path d="M250 250l100 100" stroke="currentColor" stroke-width="40" stroke-linecap="round"/>',
  box: '<path d="M200 40l140 70v160l-140 70-140-70V110z" opacity=".9"/><path d="M200 40v160M60 110l140 90 140-90" fill="none" stroke="#fff" stroke-width="12" opacity=".7"/>',
  heart: '<path d="M200 350C80 270 40 200 40 140c0-50 40-90 90-90 30 0 55 15 70 40 15-25 40-40 70-40 50 0 90 40 90 90 0 60-40 130-160 210z"/>',
  chart: '<g><rect x="50" y="210" width="60" height="140" rx="8"/><rect x="140" y="140" width="60" height="210" rx="8"/><rect x="230" y="80" width="60" height="270" rx="8"/></g><path d="M50 150l100-70 90-30 110-20" fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round"/>',
  check: '<circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" stroke-width="30"/><path d="M130 205l50 50 100-120" fill="none" stroke="currentColor" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>',
  path: '<g fill="none" stroke="currentColor" stroke-width="22" stroke-linecap="round"><path d="M60 330C140 330 120 220 200 220s60-110 140-110"/></g><circle cx="60" cy="330" r="26"/><circle cx="200" cy="220" r="26"/><circle cx="340" cy="110" r="26"/>',
  book: '<path d="M50 70h130c15 0 20 10 20 20v250c0-10-5-20-20-20H50zM350 70H220c-15 0-20 10-20 20v250c0-10 5-20 20-20h130z"/>',
}
const categoryMotif = {
  'HSE & K3': 'shield', Tekpol: 'gear', Tanaman: 'cane', 'Quality Assurance': 'lab', Audit: 'magnify', 'Risk Management': 'check', Procurement: 'box',
  'Human Capital': 'heart', 'Legal dan Management Asset': 'chain', Strategic: 'path', IT: 'chart', Finance: 'chart', 'Sistem Management': 'leaf',
}

const css = `*{box-sizing:border-box}body{margin:0;font-family:-apple-system,"Helvetica Neue",Arial,sans-serif}`
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
function bg(hue) {
  return `linear-gradient(135deg,hsl(${hue} 55% 20%),hsl(${(hue + 28) % 360} 60% 36%))`
}
function art(motif, size, extra = '') {
  return `<svg viewBox="0 0 400 400" width="${size}" height="${size}" fill="#fff" color="#fff" style="opacity:.2;${extra}">${motifs[motif] ?? motifs.book}</svg>`
}
function coverHtml({ title, label, motif, hue }) {
  return `<html><style>${css}</style><body style="width:1200px;height:675px;background:${bg(hue)};position:relative;overflow:hidden;color:#fff">
<div style="position:absolute;right:40px;top:90px">${art(motif, 520)}</div>
<div style="position:absolute;left:70px;top:70px;font-size:26px;letter-spacing:.14em;text-transform:uppercase;opacity:.8">${esc(label)}</div>
<div style="position:absolute;left:70px;top:150px;width:700px;font-size:60px;font-weight:800;line-height:1.12">${esc(title)}</div>
<div style="position:absolute;left:70px;bottom:56px;font-size:24px;opacity:.75">SUGARLedge · Learning Management System</div></body></html>`
}
function slideHtml({ heading, bullets, motif, hue, n, total }) {
  return `<html><style>${css}</style><body style="width:1280px;height:720px;background:${bg(hue)};position:relative;overflow:hidden;color:#fff">
<div style="position:absolute;right:50px;bottom:40px">${art(motif, 380)}</div>
<div style="position:absolute;left:90px;top:80px;font-size:54px;font-weight:800;width:900px;line-height:1.15">${esc(heading)}</div>
<ul style="position:absolute;left:110px;top:290px;width:820px;margin:0;padding:0 0 0 30px;font-size:40px;line-height:1.55">${bullets.map((b) => `<li style="margin-bottom:14px">${esc(b)}</li>`).join('')}</ul>
<div style="position:absolute;left:90px;bottom:40px;font-size:22px;opacity:.7">SUGARLedge · ${n} / ${total}</div></body></html>`
}
function md(text) {
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')
  const html = []
  let list = null
  const close = () => { if (list) { html.push(`</${list}>`); list = null } }
  for (const line of text.split('\n')) {
    const h3 = line.match(/^### (.*)/), h2 = line.match(/^## (.*)/), ul = line.match(/^- (.*)/), ol = line.match(/^\d+\. (.*)/)
    if (h2) { close(); html.push(`<h2>${inline(h2[1])}</h2>`) } else if (h3) { close(); html.push(`<h3>${inline(h3[1])}</h3>`) }
    else if (ul) { if (list !== 'ul') { close(); html.push('<ul>'); list = 'ul' } html.push(`<li>${inline(ul[1])}</li>`) }
    else if (ol) { if (list !== 'ol') { close(); html.push('<ol>'); list = 'ol' } html.push(`<li>${inline(ol[1])}</li>`) }
    else if (line.trim()) { close(); html.push(`<p>${inline(line)}</p>`) }
  }
  close()
  return html.join('\n')
}
function pdfHtml(c) {
  return `<html><style>${css}
body{padding:0;color:#1f2933;font-size:12.5pt;line-height:1.6}
.band{background:${bg(c.hue)};color:#fff;padding:34px 48px}.band small{letter-spacing:.14em;text-transform:uppercase;opacity:.8}
.band h1{margin:10px 0 0;font-size:25pt;line-height:1.2}main{padding:12px 48px 40px}
h2{font-size:16pt;margin:1.4em 0 .3em;color:hsl(${c.hue} 55% 24%)}h3{font-size:13pt;margin:1.1em 0 .2em}li{margin:.25em 0}
.foot{margin:30px 48px 0;padding-top:10px;border-top:1px solid #d5dbe1;font-size:9.5pt;color:#667}</style><body>
<div class="band"><small>${esc(c.code)} · Bahan bacaan</small><h1>${esc(c.title)}</h1></div>
<main>${md(c.article)}</main><div class="foot">Materi demo SUGARLedge. Disusun untuk keperluan pelatihan internal; bukan dokumen resmi perusahaan.</div></body></html>`
}

const browser = await chromium.launch()
const page = await browser.newPage()
const manifest = []
async function shot(file, html, width, height) {
  if (existsSync(out + file)) return
  await page.setViewportSize({ width, height })
  await page.setContent(html)
  await page.screenshot({ path: out + file, type: 'png' })
}

for (const c of elearning) {
  await shot(`cover-${c.code}.png`, coverHtml({ title: c.title, label: c.category, motif: c.motif, hue: c.hue }), 1200, 675)
  manifest.push({ key: `cover-${c.code}`, file: `cover-${c.code}.png`, kind: 'IMAGE', type: 'image/png' })
  if (!existsSync(`${out}handout-${c.code}.pdf`)) {
    await page.setContent(pdfHtml(c))
    await page.pdf({ path: `${out}handout-${c.code}.pdf`, format: 'A4', printBackground: true, margin: { top: '0', bottom: '16mm', left: '0', right: '0' } })
  }
  manifest.push({ key: `handout-${c.code}`, file: `handout-${c.code}.pdf`, kind: 'DOCUMENT', type: 'application/pdf' })
  if (!existsSync(`${out}video-${c.code}.mp4`)) {
    const list = []
    for (const [i, [heading, bullets]] of c.slides.entries()) {
      const f = `slide-${c.code}-${i + 1}.png`
      await shot(f, slideHtml({ heading, bullets, motif: c.motif, hue: c.hue, n: i + 1, total: c.slides.length }), 1280, 720)
      list.push(f)
    }
    const args = ['-y', '-loglevel', 'error']
    for (const f of list) args.push('-loop', '1', '-t', '12', '-i', out + f)
    args.push('-filter_complex', `${list.map((_, i) => `[${i}:v]format=yuv420p,scale=1280:720[v${i}]`).join(';')};${list.map((_, i) => `[v${i}]`).join('')}concat=n=${list.length}:v=1:a=0[v]`)
    args.push('-map', '[v]', '-r', '25', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30', '-movflags', '+faststart', `${out}video-${c.code}.mp4`)
    execFileSync('ffmpeg', args)
  }
  manifest.push({ key: `video-${c.code}`, file: `video-${c.code}.mp4`, kind: 'VIDEO', type: 'video/mp4' })
}
for (const c of onsite) {
  const motif = categoryMotif[c.category] ?? 'book'
  const hue = [...c.code].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 360, 7)
  await shot(`cover-${c.code}.png`, coverHtml({ title: c.title.length > 90 ? `${c.title.slice(0, 87)}…` : c.title, label: c.category, motif, hue }), 1200, 675)
  manifest.push({ key: `cover-${c.code}`, file: `cover-${c.code}.png`, kind: 'IMAGE', type: 'image/png' })
}
for (const a of articles) {
  await shot(`${a.key}-cover.png`, coverHtml({ title: a.title, label: a.category, motif: a.motif, hue: a.hue }), 1200, 675)
  manifest.push({ key: `${a.key}-cover`, file: `${a.key}-cover.png`, kind: 'IMAGE', type: 'image/png' })
  for (const m of a.html.matchAll(/\{\{img:(.+?)\}\}/g)) {
    await shot(`${m[1]}.png`, coverHtml({ title: 'Ilustrasi', label: a.category, motif: a.motif, hue: (a.hue + 40) % 360 }), 1200, 675)
    manifest.push({ key: m[1], file: `${m[1]}.png`, kind: 'IMAGE', type: 'image/png' })
  }
}
// Scans for uploaded credentials (the employee-side upload).
for (let i = 1; i <= 12; i++) {
  const f = `scan-sertifikat-${i}.pdf`
  if (!existsSync(out + f)) {
    await page.setContent(`<html><style>${css}</style><body style="padding:60px;border:10px double #9aa;margin:20px;height:900px"><h1 style="text-align:center">SERTIFIKAT</h1><p style="text-align:center;font-size:20px">Pindaian contoh dokumen sertifikat untuk lingkungan demo.<br>Nomor contoh ${i}/DEMO/2026</p></body></html>`)
    await page.pdf({ path: out + f, format: 'A4', printBackground: true })
  }
  manifest.push({ key: `scan-${i}`, file: f, kind: 'DOCUMENT', type: 'application/pdf', credential: true })
}
// PSDM pilot modules: the cover is the module's own first page (slides fill the frame; a portrait page shows its top,
// where the title is), and the PDF fetched by seed/gen/piloting-fetch.mjs (uploaded as demo-<code>.pdf).
const firstPage = (m) => {
  const png = `${out}piloting/page1-${m.code}.png`
  if (!existsSync(png)) execFileSync('pdftoppm', ['-f', '1', '-l', '1', '-png', '-singlefile', '-scale-to', '1400', `${out}piloting/${m.code}.pdf`, png.replace(/\.png$/, '')])
  return `data:image/png;base64,${readFileSync(png).toString('base64')}`
}
for (const u of pilotUnits) {
  for (const m of u.modules) {
    if (m.sameAs) continue
    await shot(`cover-${m.code}-halaman1.png`, `<html><style>${css}</style><body style="width:1200px;height:675px;background:#e5e7eb">
<img src="${firstPage(m)}" style="width:100%;height:100%;object-fit:cover;object-position:center top"></body></html>`, 1200, 675)
    manifest.push({ key: `cover-${m.code}`, file: `cover-${m.code}-halaman1.png`, kind: 'IMAGE', type: 'image/png' })
    manifest.push({ key: `doc-${m.code}`, file: `piloting/${m.code}.pdf`, name: `${m.code}.pdf`, kind: 'DOCUMENT', type: 'application/pdf' })
  }
}
writeFileSync(`${out}manifest.json`, JSON.stringify(manifest, null, 1))
await browser.close()
console.log(`assets: ${manifest.length} files in ${out}`)
