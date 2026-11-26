// Puts the real organisation (units, positions, each employee's unit and position) into IAM through its public API, for a
// server reached only over HTTPS. Reads seed/data/private/{units,positions,people}.json (node seed/gen/directory-formasi.mjs).
// Only creates what is missing and changes what differs, so it is safe to repeat; names, NIK, profile, account, password
// and LMS progress are kept. Without --apply it only counts what it would change.
// Needs the IAM with the org write endpoints (sgn-iam-contracts 0.10.0) and the IAM superadmin login (ADMIN_LOGIN).
// Usage: BASE=https://lms.example.co.id ADMIN_LOGIN=… ADMIN_PASSWORD='…' node seed/gen/iam-org-api.mjs [--apply]
import { readFileSync, writeFileSync } from 'node:fs'

const here = new URL('..', import.meta.url).pathname
const read = (f) => JSON.parse(readFileSync(`${here}data/private/${f}.json`, 'utf8'))
const BASE = (process.env.BASE ?? '').replace(/\/$/, '')
const { ADMIN_LOGIN, ADMIN_PASSWORD } = process.env
if (!BASE || !ADMIN_LOGIN || !ADMIN_PASSWORD) throw new Error('set BASE, ADMIN_LOGIN and ADMIN_PASSWORD')
const APPLY = process.argv.includes('--apply')
const OLD_ROOT = 'PTSGN-ROOT'
const IAM = `${BASE}/api/iam/v1`

let token = null
async function login() {
  const res = await fetch(`${IAM}/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ login_id: ADMIN_LOGIN, password: ADMIN_PASSWORD }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`login ${res.status}: ${body.error?.message ?? JSON.stringify(body)}`)
  if (body.must_change_password) throw new Error('the superadmin must change its password first (sign in once in the app)')
  token = body.access_token
}

// call retries network errors and 5xx, and signs in again when the 15-minute token runs out.
async function call(method, path, body) {
  for (let attempt = 1; ; attempt++) {
    let res
    try {
      res = await fetch(path.startsWith('http') ? path : `${IAM}${path}`, {
        method, headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch (err) {
      if (attempt >= 5) throw err
      await new Promise((r) => setTimeout(r, attempt * 2000))
      continue
    }
    if (res.status === 401 && attempt < 3) { await login(); continue }
    if (res.status >= 500 && attempt < 5) { await new Promise((r) => setTimeout(r, attempt * 2000)); continue }
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      const err = new Error(`${method} ${path} ${res.status} ${data?.error?.code ?? ''}: ${data?.error?.message ?? ''}`)
      err.code = data?.error?.code
      throw err
    }
    return data
  }
}

// pool runs fn over items, n at a time.
async function pool(items, n, fn) {
  let i = 0
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k) } }))
}
const progress = (label, done, total) => { if (done % 500 === 0 || done === total) console.log(`  ${label}: ${done}/${total}`) }

const units = read('units')
const positions = read('positions')
const people = read('people')
const errors = []
const plan = { unitsCreated: 0, unitsMoved: 0, rootOff: 0, positionsCreated: 0, employeesMoved: 0, employeesMissing: 0, unchanged: 0 }

await login()
console.log(`${APPLY ? 'APPLY' : 'DRY RUN (nothing is written; add --apply)'} against ${BASE}`)

// 1. Units: read the whole tree, then create the missing ones parents first and re-hang or rename the ones that differ.
console.log('1/4 Units')
const byCode = new Map() // code -> {id, code, name, parent_id, is_active}
async function walk(parentId) {
  const { items } = await call('GET', `/org-units${parentId ? `?parent_id=${parentId}` : ''}`)
  for (const u of items) byCode.set(u.code.toUpperCase(), u)
  await pool(items.filter((u) => u.child_count > 0), 4, (u) => walk(u.id))
}
await walk(null)
const idOf = (code) => byCode.get(code?.toUpperCase())?.id ?? null
for (const u of units) {
  const have = byCode.get(u.code.toUpperCase())
  const parentId = u.parent ? idOf(u.parent) : null
  if (u.parent && parentId == null && APPLY) { errors.push(`unit ${u.code}: parent ${u.parent} missing`); continue }
  if (!have) {
    plan.unitsCreated++
    if (!APPLY) { byCode.set(u.code.toUpperCase(), { id: -plan.unitsCreated, code: u.code }); continue }
    try {
      byCode.set(u.code.toUpperCase(), await call('POST', '/org-units', { code: u.code, name: u.name, parent_id: parentId }))
    } catch (err) { errors.push(`unit ${u.code}: ${err.message}`) }
  } else if (have.parent_id !== parentId || have.name !== u.name || !have.is_active) {
    plan.unitsMoved++
    if (!APPLY) continue
    try {
      byCode.set(u.code.toUpperCase(), await call('PUT', `/org-units/${have.id}`, { code: have.code, name: u.name, parent_id: parentId, is_active: true }))
    } catch (err) { errors.push(`unit ${u.code}: ${err.message}`) }
  }
}
// The old "PT Sinergi Gula Nusantara" root: PT SGN is the company, not a unit, so it is switched off once it is empty.
const root = byCode.get(OLD_ROOT)
if (root?.is_active) {
  plan.rootOff++
  if (APPLY) {
    try { await call('PUT', `/org-units/${root.id}`, { code: root.code, name: root.name, parent_id: null, is_active: false }) }
    catch (err) { errors.push(`unit ${OLD_ROOT} (switch off): ${err.message}`) }
  }
}

// 2. Positions: each unit's list, then the missing ones.
console.log('2/4 Positions')
const posId = new Map() // code -> id
const unitCodes = [...new Set(positions.map((p) => p.unit))]
let seen = 0
await pool(unitCodes, 6, async (code) => {
  const id = idOf(code)
  if (id > 0) for (const p of (await call('GET', `/org-units/${id}`)).positions) posId.set(p.code.toUpperCase(), p.id)
  progress('units read', ++seen, unitCodes.length)
})
const missingPositions = positions.filter((p) => !posId.has(p.code.toUpperCase()))
plan.positionsCreated = missingPositions.length
if (APPLY) {
  let made = 0
  await pool(missingPositions, 6, async (p) => {
    try {
      const created = await call('POST', `/org-units/${idOf(p.unit)}/positions`, { code: p.code, name: p.name, is_head: p.head })
      posId.set(p.code.toUpperCase(), created.id)
    } catch (err) { errors.push(`position ${p.code}: ${err.message}`) }
    progress('positions created', ++made, missingPositions.length)
  })
}

// 3. Employees: where each one is now (10 per page), then move the ones placed elsewhere or nowhere.
console.log('3/4 Employees')
const first = await call('GET', '/employees?page=1')
if (first.items.length && !('employee_number' in first.items[0])) throw new Error('IAM is older than 0.10.0: deploy the new sgn-stack-iam first')
const pages = Math.ceil(first.total / first.limit)
const current = new Map() // employee_number -> {id, unit, position}
const keep = (items) => { for (const e of items) if (e.employee_number) current.set(e.employee_number, e) }
keep(first.items)
let read_ = 1
await pool(Array.from({ length: pages - 1 }, (_, i) => i + 2), 8, async (page) => {
  keep((await call('GET', `/employees?page=${page}`)).items)
  progress('pages read', ++read_, pages)
})
const moves = []
for (const p of people) {
  const e = current.get(p.pn)
  if (!e) { plan.employeesMissing++; continue }
  const unitId = idOf(p.unit), positionId = posId.get(p.position.toUpperCase()) ?? null
  if (e.unit?.id === unitId && e.position?.id === positionId && unitId > 0) { plan.unchanged++; continue }
  moves.push({ pn: p.pn, id: e.id, unitId, positionId })
}
plan.employeesMoved = moves.length
if (APPLY) {
  let done = 0
  await pool(moves, 8, async (m) => {
    try {
      if (!(m.unitId > 0) || m.positionId == null) throw new Error('unit or position missing')
      const d = await call('GET', `/employees/${m.id}`)
      await call('PUT', `/employees/${m.id}`, {
        name: d.name, nik: d.nik, unit_id: m.unitId, position_id: m.positionId,
        function_name: d.profile.function_name, education_level: d.profile.education_level,
        education_major: d.profile.education_major, birth_date: d.profile.birth_date, is_active: d.is_active,
      })
    } catch (err) { errors.push(`employee ${m.pn}: ${err.message}`) }
    progress('employees moved', ++done, moves.length)
  })
}

// 4. LMS copies the change (the same as Sync sekarang on /lms/admin/sync).
console.log('4/4 LMS sync')
if (APPLY) {
  try { console.log(' ', JSON.stringify(await call('POST', `${BASE}/api/lms/v1/admin/sync/iam`))) }
  catch (err) { errors.push(`LMS sync: ${err.message} (run Sync sekarang on /lms/admin/sync, or wait for the hourly sync)`) }
}

console.log('\nUnits to create', plan.unitsCreated, '| to move or rename', plan.unitsMoved, '| old root to switch off', plan.rootOff)
console.log('Positions to create', plan.positionsCreated)
console.log('Employees to move', plan.employeesMoved, '| already right', plan.unchanged, '| not in IAM', plan.employeesMissing)
if (errors.length) {
  const file = `${here}data/private/iam-org-api-errors.txt`
  writeFileSync(file, `${errors.join('\n')}\n`)
  console.log(`\n${errors.length} errors, listed in ${file}; run again to retry them.`)
  for (const e of errors.slice(0, 10)) console.log(' ', e)
  process.exitCode = 1
} else console.log(APPLY ? '\nDone.' : '\nNothing written. Run again with --apply.')
