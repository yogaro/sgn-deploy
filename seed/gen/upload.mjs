// Uploads seed/assets through the LMS media API (as an L&D admin), skipping files already stored, then writes assets/media.json.
// Needs the stack up and the demo accounts seeded. Run: node seed/gen/upload.mjs
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const base = process.env.LMS_BASE ?? 'http://127.0.0.1:3003'
const password = process.env.DEMO_PASSWORD ?? 'Demo#Sgn2026'
const root = new URL('..', import.meta.url).pathname
const manifest = JSON.parse(readFileSync(`${root}assets/manifest.json`, 'utf8'))
// The stored file name; `name` stands in for a file kept in a sub-folder of assets.
const stored = (m) => `demo-${m.name ?? m.file}`
const psql = (sql) => execFileSync('docker', ['compose', 'exec', '-T', 'postgres', 'psql', '-U', 'sgn', '-d', 'db_lms', '-At', '-c', sql], { cwd: `${root}..`, encoding: 'utf8' })
// seed/run.sh hands the query results over as files (SEED_MEDIA_HAVE, SEED_MEDIA_ROWS) when node runs without docker.
const query = (env, sql) => (process.env[env] ? readFileSync(process.env[env], 'utf8') : psql(sql))
const listSql = "SELECT file_name FROM course.media WHERE status = 'READY' AND file_name LIKE 'demo-%'"
const rowsSql = "SELECT file_name, id, kind, coalesce(duration_s, 0) FROM course.media WHERE status = 'READY' AND file_name LIKE 'demo-%'"

// --index writes media.json from SEED_MEDIA_ROWS only; the uploads ran in an earlier call.
function writeIndex() {
  const rows = query('SEED_MEDIA_ROWS', rowsSql).split('\n').filter(Boolean)
  const byName = new Map(rows.map((r) => r.split('|')).map(([n, id, kind, d]) => [n, { id: Number(id), kind, duration: Number(d) }]))
  const media = {}
  for (const m of manifest) {
    const row = byName.get(stored(m))
    if (!row) throw new Error(`missing ${m.file}`)
    media[m.key] = row
  }
  writeFileSync(`${root}assets/media.json`, JSON.stringify(media, null, 1))
  console.log(`media.json: ${Object.keys(media).length} entries`)
}
if (process.argv.includes('--index')) {
  writeIndex()
  process.exit(0)
}

let token = ''
async function login() {
  const r = await fetch(`${base}/api/iam/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ login_id: process.env.SEED_ADMIN_LOGIN ?? 'ADMIN-LMS', password }) })
  if (!r.ok) throw new Error(`login ${r.status}`)
  token = (await r.json()).access_token
}
async function api(path, init = {}, retry = true) {
  const r = await fetch(`${base}/api/lms/v1${path}`, { ...init, headers: { ...init.headers, authorization: `Bearer ${token}`, 'content-type': 'application/json' } })
  if (r.status === 401 && retry) { await login(); return api(path, init, false) }
  return r
}

await login()
const have = new Set(query('SEED_MEDIA_HAVE', listSql).split('\n').filter(Boolean))
const todo = manifest.filter((m) => !have.has(stored(m)))
console.log(`${manifest.length} assets, ${todo.length} to upload`)
let done = 0
async function one(m) {
  const bytes = readFileSync(`${root}assets/${m.file}`)
  const t = await api('/media/uploads', { method: 'POST', body: JSON.stringify({ kind: m.kind, file_name: stored(m), content_type: m.type, size_bytes: bytes.length }) })
  if (t.status !== 201) throw new Error(`${m.file}: ticket ${t.status} ${await t.text()}`)
  const ticket = await t.json()
  const put = await fetch(ticket.upload_url, { method: 'PUT', headers: ticket.headers, body: bytes })
  if (!put.ok) throw new Error(`${m.file}: put ${put.status} ${await put.text()}`)
  const c = await api(`/media/${ticket.media_id}/complete`, { method: 'POST' })
  if (c.status !== 200) throw new Error(`${m.file}: complete ${c.status} ${await c.text()}`)
  done += 1
  if (done % 10 === 0) console.log(`  ${done}/${todo.length}`)
}
const queue = [...todo]
await Promise.all(Array.from({ length: 4 }, async () => { for (let m; (m = queue.shift()); ) await one(m) }))

// With SEED_MEDIA_HAVE the caller writes the index next (--index), once the uploads are in the database.
if (!process.env.SEED_MEDIA_HAVE) writeIndex()
