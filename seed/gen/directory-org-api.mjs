// Puts the real organisation into a running Directory through its public API, then has IAM and LMS copy it: for a server
// reached only over HTTPS that still runs Directory (the 11-container stack). Same tree as directory-formasi.mjs: Head
// Office on top, the clusters under it, the mills and estates under their cluster; the old PTSGN-ROOT unit is switched off.
// Reads seed/data/private/{units,positions,people}.json (node seed/gen/directory-formasi.mjs). Only creates what is
// missing, so it is safe to repeat; names, accounts, passwords and LMS progress are kept. Without --apply it only counts.
// Usage: DIRECTORY=https://directory.example.co.id DIRECTORY_EMAIL=… DIRECTORY_PASSWORD='…' \
//        BASE=https://lms.example.co.id LOGIN=ADMIN-LMS PASSWORD='…' node seed/gen/directory-org-api.mjs [--apply]
//   DIRECTORY_EMAIL/PASSWORD: the Directory admin (stack env DIRECTORY_ADMIN_EMAIL/PASSWORD).
//   LOGIN/PASSWORD: an LMS account allowed to run the IAM and LMS syncs (the Admin L&D account ADMIN-LMS).
import { readFileSync, writeFileSync } from 'node:fs'

const here = new URL('..', import.meta.url).pathname
const read = (f) => JSON.parse(readFileSync(`${here}data/private/${f}.json`, 'utf8'))
const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`set ${k}`); return v.replace(/\/$/, '') }
const DIR = `${env('DIRECTORY')}/api`
const BASE = env('BASE')
const APPLY = process.argv.includes('--apply')
const OLD_ROOT = 'PTSGN-ROOT'
const START = '2026-01-01'

let cookie = ''
async function dirLogin() {
  const res = await fetch(`${DIR}/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: env('DIRECTORY_EMAIL'), password: process.env.DIRECTORY_PASSWORD }),
  })
  if (!res.ok) throw new Error(`Directory login ${res.status}: ${await res.text()}`)
  cookie = res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ')
}

// call retries network errors and 5xx, and signs in again when the session is gone.
async function call(method, url, body, headers = () => ({ cookie }), relogin = dirLogin) {
  for (let attempt = 1; ; attempt++) {
    let res
    try {
      res = await fetch(url, {
        method, headers: { ...headers(), ...(body ? { 'content-type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch (err) {
      if (attempt >= 5) throw err
      await new Promise((r) => setTimeout(r, attempt * 2000))
      continue
    }
    if (res.status === 401 && attempt < 3) { await relogin(); continue }
    if (res.status >= 500 && res.status !== 504 && attempt < 5) { await new Promise((r) => setTimeout(r, attempt * 2000)); continue }
    const text = await res.text()
    const data = text ? (() => { try { return JSON.parse(text) } catch { return text } })() : null
    if (!res.ok) {
      const err = new Error(`${method} ${url.replace(/^https?:\/\/[^/]+/, '')} ${res.status}: ${data?.detail ?? data?.error?.message ?? String(text).slice(0, 200)}`)
      err.status = res.status
      throw err
    }
    return data
  }
}
const dir = (method, path, body) => call(method, `${DIR}${path}`, body)

async function pool(items, n, fn) {
  let i = 0
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k) } }))
}
const progress = (label, done, total) => { if (done % 1000 === 0 || done === total) console.log(`  ${label}: ${done}/${total}`) }

const units = read('units')
const positions = read('positions')
const people = read('people')
const errors = []
const plan = { unitsCreated: 0, unitsChanged: 0, rootOff: 0, positionsCreated: 0, assignmentsCreated: 0, alreadyPlaced: 0, usersMissing: 0 }

let token = ''
async function lmsLogin() {
  const res = await fetch(`${BASE}/api/iam/v1/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ login_id: env('LOGIN'), password: process.env.PASSWORD }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`LMS login as ${process.env.LOGIN} ${res.status}: ${body.error?.message ?? ''}`)
  token = body.access_token
}
const lms = (method, path) => call(method, `${BASE}${path}`, null, () => ({ authorization: `Bearer ${token}` }), lmsLogin)

// Both sign-ins first, so a wrong password stops the run before anything is read or written.
await dirLogin()
await lmsLogin()

// --sync: copy the placements to IAM in batches. A full IAM sync of every employee outlasts the proxy timeout (504), and
// a placement alone does not mark the person as changed, so each batch re-imports the people's own profile values (which
// only marks them changed) and then runs an incremental IAM sync of just them. LMS picks the change up in its hourly sync.
if (process.argv.includes('--sync')) {
  const BATCH = Number(process.env.SYNC_BATCH ?? 300)
  const SYNC_FROM = Number(process.env.SYNC_FROM ?? 0)
  const runs = await lms('GET', '/api/iam/v1/sync/runs?page=1')
  for (const r of (runs.items ?? []).slice(0, 3)) console.log(`  last IAM sync: ${r.status} ${r.trigger} ${r.started_at} ${JSON.stringify(r.stats ?? {})}`)
  const wanted = new Set(people.map((p) => p.pn))
  const users = new Map()
  const first = await dir('GET', '/users?limit=100&page=1')
  const pages = Math.ceil(first.total / first.limit)
  const keep = (list) => { for (const u of list) if (wanted.has(u.employeeNumber)) users.set(u.employeeNumber, u) }
  keep(first.data)
  await pool(Array.from({ length: pages - 1 }, (_, i) => i + 2), 6, async (page) => keep((await dir('GET', `/users?limit=100&page=${page}`)).data))
  for (const p of people.filter((x) => !users.has(x.pn))) {
    const hit = (await dir('GET', `/users?limit=100&search=${encodeURIComponent(p.pn)}`)).data.find((u) => u.employeeNumber === p.pn)
    if (hit) users.set(p.pn, hit)
  }
  const list = [...users.values()]
  // First an incremental sync that marks nobody new: it carries only what already changed since the last successful sync
  // (the new units and positions, and anyone marked by an earlier try). Once it succeeds, every batch after it is small.
  // 409 means IAM thinks a sync is running: an earlier run cut off by the proxy can leave its lock on a pooled database
  // connection, so another try usually lands on a free one. Wait and try again before giving up.
  const sync = async (label) => {
    for (let attempt = 1; ; attempt++) {
      const t = Date.now()
      try {
        const stats = await lms('POST', '/api/iam/v1/sync/directory')
        console.log(`  ${label}: ${JSON.stringify(stats)} ${Math.round((Date.now() - t) / 1000)}s`)
        return
      } catch (err) {
        if (err.status !== 409 || attempt >= 20) throw err
        await new Promise((r) => setTimeout(r, 3000))
      }
    }
  }
  if (!SYNC_FROM) {
    console.log('Units and positions first...')
    try { await sync('units and positions') } catch (err) {
      console.log(`  failed: ${err.message.slice(0, 120)}`)
      console.log(err.status === 504
        ? '\nThe new units and positions alone take longer than the proxy waits, so this route cannot finish over HTTPS.'
        : '\nRun --sync again.')
      process.exit(1)
    }
  }
  console.log(`${list.length - SYNC_FROM} employees to sync in batches of ${BATCH}`)
  for (let i = SYNC_FROM; i < list.length; i += BATCH) {
    const batch = list.slice(i, i + BATCH)
    try {
      await dir('POST', '/users/profile-import', { rows: batch.map((u) => ({
        employeeNumber: u.employeeNumber, functionName: u.function?.name ?? null, educationLevel: u.educationLevel ?? null,
        educationMajor: u.educationMajor ?? null, birthDate: u.birthDate ?? null,
      })) })
      await sync(`${Math.min(i + BATCH, list.length)}/${list.length}`)
    } catch (err) {
      errors.push(`batch from ${i}: ${err.message}`)
      console.log(`  batch from ${i} failed: ${err.message.slice(0, 120)}`)
      console.log(`  continue later with: SYNC_FROM=${i} SYNC_BATCH=${Math.max(50, Math.floor(BATCH / 2))} node seed/gen/directory-org-api.mjs --sync`)
      break
    }
  }
  try { console.log('LMS sync:', JSON.stringify(await lms('POST', '/api/lms/v1/admin/sync/iam'))) }
  catch (err) { console.log(`LMS sync ${err.status ?? ''}: LMS copies the change in its hourly sync, or run Sync sekarang on /lms/admin/sync later.`) }
  if (errors.length) { console.log(`\n${errors.length} batch errors; run --sync again.`); process.exitCode = 1 } else console.log('\nDone.')
  process.exit()
}

console.log(`${APPLY ? 'APPLY' : 'DRY RUN (nothing is written; add --apply)'}: Directory ${DIR}, LMS ${BASE}`)

// 1. Units
console.log('1/5 Units')
const instansi = (await dir('GET', '/instansi?search=SGN0&limit=100')).data.find((i) => i.instansiCode === 'SGN0')
if (!instansi) throw new Error('instansi SGN0 not found in Directory')
const byCode = new Map((await dir('GET', '/units/tree')).map((u) => [u.unitCode.toUpperCase(), u]))
const idOf = (code) => byCode.get(code?.toUpperCase())?.id ?? null
// Directory's API cannot clear a unit's parent, so the old root becomes Head Office instead: the current Head Office takes
// a spare code (and is switched off once its children have moved under the renamed root).
const HO = 'PTSGN-HO', SPARE = 'PTSGN-HO-LAMA'
const rootUnit = byCode.get(OLD_ROOT)
if (rootUnit && (byCode.get(HO)?.parentUnitId || byCode.has(SPARE))) {
  plan.rootSwap = 1
  const ho = byCode.get(HO)
  if (APPLY) {
    if (ho) byCode.set(SPARE, await dir('PATCH', `/units/${ho.id}`, {
      updatedAt: ho.updatedAt, unitCode: SPARE, unitName: 'Head Office (lama)', parentUnitId: ho.parentUnitId, instansiId: ho.instansiId, level: ho.level,
    }))
    byCode.set(HO, await dir('PATCH', `/units/${rootUnit.id}`, {
      updatedAt: rootUnit.updatedAt, unitCode: HO, unitName: 'Head Office', parentUnitId: null, instansiId: rootUnit.instansiId, level: 1,
    }))
  } else {
    if (ho) byCode.set(SPARE, ho)
    byCode.set(HO, { ...rootUnit, unitCode: HO, unitName: 'Head Office', level: 1 })
  }
  byCode.delete(OLD_ROOT)
}
let fake = 0
for (const u of units) {
  const have = byCode.get(u.code.toUpperCase())
  const parentId = u.parent ? idOf(u.parent) : null
  if (u.parent && !parentId) { errors.push(`unit ${u.code}: parent ${u.parent} missing`); continue }
  if (!have) {
    plan.unitsCreated++
    if (!APPLY) { byCode.set(u.code.toUpperCase(), { id: `new-${++fake}`, unitCode: u.code }); continue }
    try {
      byCode.set(u.code.toUpperCase(), await dir('POST', '/units', { unitCode: u.code, unitName: u.name, parentUnitId: parentId, instansiId: instansi.id, level: u.level }))
    } catch (err) { errors.push(`unit ${u.code}: ${err.message}`) }
  } else if ((have.parentUnitId ?? null) !== parentId || have.unitName !== u.name || have.level !== u.level) {
    plan.unitsChanged++
    if (!APPLY) continue
    try {
      byCode.set(u.code.toUpperCase(), await dir('PATCH', `/units/${have.id}`, {
        updatedAt: have.updatedAt, unitCode: have.unitCode, unitName: u.name, parentUnitId: parentId, instansiId: have.instansiId, level: u.level,
      }))
    } catch (err) { errors.push(`unit ${u.code}: ${err.message}`) }
  }
}
for (const code of [SPARE, OLD_ROOT]) {
  const old = byCode.get(code)
  if (!old?.isActive) continue
  plan.rootOff++
  if (APPLY) {
    try { await dir('DELETE', `/units/${old.id}`) } catch (err) { errors.push(`unit ${code} (switch off): ${err.message}`) }
  }
}
const isNew = (id) => typeof id === 'string' && id.startsWith('new-')

// 2. Positions: heads first, so the others can report to their unit's head.
console.log('2/5 Positions')
const posId = new Map() // code -> id
const unitCodes = [...new Set(positions.map((p) => p.unit))]
let seen = 0
await pool(unitCodes, 6, async (code) => {
  const id = idOf(code)
  if (id && !isNew(id)) for (const p of await dir('GET', `/units/${id}/positions`)) posId.set(p.positionCode.toUpperCase(), p.id)
  progress('units read', ++seen, unitCodes.length)
})
const missing = positions.filter((p) => !posId.has(p.code.toUpperCase()))
plan.positionsCreated = missing.length
const headOf = new Map(positions.filter((p) => p.head).map((p) => [p.unit, p.code]))
if (APPLY) {
  for (const group of [missing.filter((p) => p.head), missing.filter((p) => !p.head)]) {
    let made = 0
    await pool(group, 6, async (p) => {
      try {
        const parent = p.head ? null : posId.get(headOf.get(p.unit)?.toUpperCase()) ?? null
        const created = await dir('POST', '/positions', { positionCode: p.code, positionName: p.name, positionLevel: p.level, unitId: idOf(p.unit), parentPositionId: parent })
        posId.set(p.code.toUpperCase(), created.id)
      } catch (err) { errors.push(`position ${p.code}: ${err.message}`) }
      progress(p.head ? 'head positions created' : 'positions created', ++made, group.length)
    })
  }
}

// 3. Assignments: everyone gets their position (409 = already holds it).
console.log('3/5 Placements')
const userId = new Map() // employee number -> id
const first = await dir('GET', '/users?limit=100&page=1')
const pages = Math.ceil(first.total / first.limit)
for (const u of first.data) userId.set(u.employeeNumber, u.id)
let readPages = 1
await pool(Array.from({ length: pages - 1 }, (_, i) => i + 2), 6, async (page) => {
  for (const u of (await dir('GET', `/users?limit=100&page=${page}`)).data) userId.set(u.employeeNumber, u.id)
  progress('user pages read', ++readPages, pages)
})
// The list is ordered by name only, so people sharing a name can slip between pages: look those up one by one.
await pool(people.filter((p) => !userId.has(p.pn)), 6, async (p) => {
  const hit = (await dir('GET', `/users?limit=100&search=${encodeURIComponent(p.pn)}`)).data.find((u) => u.employeeNumber === p.pn)
  if (hit) userId.set(p.pn, hit.id)
})
const todo = people.filter((p) => { if (userId.has(p.pn)) return true; plan.usersMissing++; return false })
if (!APPLY) {
  plan.assignmentsCreated = todo.filter((p) => !posId.has(p.position.toUpperCase())).length
  plan.alreadyPlaced = null
} else {
  let done = 0
  await pool(todo, 8, async (p) => {
    const pid = posId.get(p.position.toUpperCase())
    try {
      if (!pid) throw new Error('position missing')
      await dir('POST', `/positions/${pid}/assignments`, { userId: userId.get(p.pn), startDate: START, isPrimary: true, isDepartmentHead: p.head })
      plan.assignmentsCreated++
    } catch (err) {
      if (err.status === 409) plan.alreadyPlaced++
      else errors.push(`placement ${p.pn}: ${err.message}`)
    }
    progress('placements', ++done, todo.length)
  })
}

// 4 and 5. IAM copies Directory in full (new placements do not mark the person as changed), then LMS copies IAM.
if (APPLY) {
  console.log('4/5 IAM sync (full; can take a few minutes)')
  const t = Date.now()
  try { console.log(' ', JSON.stringify(await lms('POST', '/api/iam/v1/sync/directory?full=true')), `${Math.round((Date.now() - t) / 1000)}s`) }
  catch (err) {
    errors.push(`IAM sync: ${err.message}${err.status === 504 ? ' (the proxy stopped waiting; run this script again: it skips what is done and syncs again)' : ''}`)
  }
  console.log('5/5 LMS sync')
  try { console.log(' ', JSON.stringify(await lms('POST', '/api/lms/v1/admin/sync/iam'))) }
  catch (err) { errors.push(`LMS sync: ${err.message} (run Sync sekarang on /lms/admin/sync)`) }
} else console.log('4/5 IAM sync, 5/5 LMS sync: sign-in checked')

console.log('\nUnits to create', plan.unitsCreated, '| to move or rename', plan.unitsChanged, '| old root renamed Head Office', plan.rootSwap ?? 0, '| old units to switch off', plan.rootOff)
console.log('Positions to create', plan.positionsCreated)
console.log(APPLY
  ? `Placements created ${plan.assignmentsCreated} | already held ${plan.alreadyPlaced} | not in Directory ${plan.usersMissing}`
  : `Placements in new positions ${plan.assignmentsCreated} (others are created only if missing) | not in Directory ${plan.usersMissing}`)
if (errors.length) {
  const file = `${here}data/private/directory-org-api-errors.txt`
  writeFileSync(file, `${errors.join('\n')}\n`)
  console.log(`\n${errors.length} errors, listed in ${file}; run again to retry them.`)
  for (const e of errors.slice(0, 10)) console.log(' ', e)
  process.exitCode = 1
} else console.log(APPLY ? '\nDone.' : '\nNothing written. Run again with --apply.')
