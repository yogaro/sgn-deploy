// Walks the demo as each persona with a headless browser, saves screenshots to docs/seed/shots and reports console/network errors.
// Usage: node seed/gen/walk.mjs   (stack must be up and seeded)
import { createRequire } from 'node:module'
const root = new URL('../../', import.meta.url).pathname
const { chromium } = createRequire(`${root}sgn-lms-fe/package.json`)('playwright')
const base = 'http://127.0.0.1:3003'
const password = 'Demo#Sgn2026'
const personas = [
  ['admin-ld', 'arief.nasution@sgn.example', ['/lms/', '/lms/admin/kursus', '/lms/admin/surat-evaluasi', '/lms/admin/penugasan', '/lms/admin/kompetensi', '/lms/admin/learning-path', '/lms/admin/verifikasi-sertifikat', '/lms/admin/knowledge-hub', '/lms/laporan', '/lms/sesi', '/lms/rencana-pelatihan']],
  ['mankeu', 'denny.susilo@sgn.example', ['/lms/', '/lms/usulan/persetujuan', '/lms/rencana-pelatihan']],
  ['pelapor', 'krisna.hasibuan@sgn.example', ['/lms/', '/lms/laporan', '/lms/rencana-pelatihan']],
  ['trainer-k3', 'untung.hasibuan@sgn.example', ['/lms/', '/lms/ajar', '/lms/sesi']],
  ['pengolahan', 'joko.gunawan@sgn.example', ['/lms/', '/lms/saya', '/lms/katalog', '/lms/learning-path', '/lms/sertifikat', '/lms/evaluasi', '/lms/kompetensi', '/lms/usulan', '/lms/knowledge-hub', '/lms/tim']],
]
const browser = await chromium.launch()
const problems = []
for (const [tag, email, paths] of personas) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 860 } })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`${tag} console: ${m.text().slice(0, 140)}`) })
  page.on('response', (r) => { if (r.status() >= 400 && r.url().includes('/api/')) problems.push(`${tag} ${r.status()} ${r.url().replace(base, '')}`) })
  for (let i = 0; i < 12; i++) {
    await page.goto(`${base}/lms/masuk`)
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: 'Masuk' }).click()
    const ok = await page.waitForURL((u) => !u.pathname.startsWith('/lms/masuk'), { timeout: 6000 }).then(() => true, () => false)
    if (ok) break
    await page.waitForTimeout(6000)
  }
  for (const p of paths) {
    await page.goto(`${base}${p}`)
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(700)
    const name = `${tag}${p.replace(/\W+/g, '-').replace(/-$/, '')}`
    await page.screenshot({ path: `${root}docs/seed/shots/${name}.png`, fullPage: false })
    const text = (await page.locator('body').innerText()).slice(0, 4000)
    if (/Terjadi kesalahan|tidak ditemukan|gagal memuat/i.test(text)) problems.push(`${tag} ${p}: error text`)
  }
  await ctx.close()
}
await browser.close()
console.log(problems.length ? problems.join('\n') : 'no problems')
