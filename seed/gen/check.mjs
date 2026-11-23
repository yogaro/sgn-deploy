// Logs in as each persona (one login each, spaced out for the IAM rate limit) and prints what the main screens return.
// Usage: node seed/gen/check.mjs [login id (NIK) ...]
const base = process.env.LMS_BASE ?? 'http://127.0.0.1:3003'
const password = process.env.DEMO_PASSWORD ?? 'Demo#Sgn2026'
const logins = process.argv.slice(2)
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
async function login(loginId) {
  for (let i = 0; i < 20; i++) {
    const r = await fetch(`${base}/api/iam/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ login_id: loginId, password }) })
    if (r.ok) return (await r.json()).access_token
    if (r.status !== 429) throw new Error(`login ${loginId}: ${r.status}`)
    await wait(5000)
  }
  throw new Error('rate limited')
}
const paths = ['me/summary', 'me/sessions', 'me/enrollments', 'me/learning-path', 'me/competencies', 'me/lna/proposals', 'me/evaluations', 'certificates', 'courses?page_size=5', 'knowledge?page_size=5']
for (const loginId of logins) {
  const t = await login(loginId)
  console.log(`\n### ${loginId}`)
  for (const p of paths) {
    const r = await fetch(`${base}/api/lms/v1/${p}`, { headers: { authorization: `Bearer ${t}` } })
    const text = await r.text()
    console.log(`${r.status} ${p} ${text.length}b ${text.slice(0, 160).replace(/\s+/g, ' ')}`)
  }
}
