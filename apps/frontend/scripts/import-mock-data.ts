// Chuyển "Dữ liệu tạm" của chế độ giả lập cũ (file JSON tải từ Thêm > Dữ liệu tạm) sang backend thật (Đợt 39).
// Tạo lại: thành viên thêm mới hoặc đã sửa, người thân, sự kiện chung, cây. Không chuyển: liên kết "Tôi là ai",
// đề xuất, thông báo, tệp đính kèm, cấu hình (gắn với tài khoản/máy chủ cũ, nhập lại bằng tay nếu cần).
//
//   node scripts/import-mock-data.ts <file.json> [--dry-run]
//
// Biến môi trường: API_BASE (mặc định http://localhost:8080) và một trong hai cách đăng nhập Admin:
//   ADMIN_TOKEN (access token, hết hạn sau 15 phút) hoặc ADMIN_EMAIL + ADMIN_PASSWORD.
// Chạy lại được: người đã có, người thân đã có và sự kiện trùng được bỏ qua. 28 người seed khớp theo id; chỉ cập nhật
// khi hồ sơ trong file khác bản gốc của seed. Cây chỉ nhập khi cây thật còn trống.
import { readFileSync } from 'node:fs'
import path from 'node:path'

// ---------- Kiểu dữ liệu của file xuất (xem git: services/mock/store.ts trước Đợt 39) ----------

type StoredMember = { id: number; fullName: string } & Record<string, unknown>
type StoredNode = {
  id: number
  memberId: number | null
  parentNodeId: number | null
  coParentNodeId: number | null
  sortOrder: number
}
type StoredSpouse = { nodeId: number; spouseNodeId: number; order: number }
type StoredRelative = { memberId: number; relativeMemberId: number; label: string }
type StoredEvent = {
  title: string
  description?: string | null
  calendar: 'SOLAR' | 'LUNAR'
  day: number
  month: number
  year?: number | null
  leap?: boolean
}
type Dump = {
  version: number
  members: StoredMember[]
  tree: { nodes: StoredNode[]; spouses?: StoredSpouse[] }
  relatives?: StoredRelative[]
  events?: StoredEvent[]
  deleted?: unknown[]
  links?: unknown[]
  linkRequests?: unknown[]
  proposals?: unknown[]
  notifications?: unknown[]
  attachments?: unknown[]
}
type SeedMember = {
  fullName: string
  isDeceased: boolean
  deathLunar?: { day: number; month: number; leap: boolean; year?: number }
  deathSolar?: { year: number; month: number; day: number }
  burialPlace?: string
}

// ---------- Tham số và gọi API ----------

const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith('--'))
const dryRun = args.includes('--dry-run')
const BASE = (process.env.API_BASE ?? 'http://localhost:8080').replace(/\/$/, '')

if (!file) {
  console.error('Cách dùng: node scripts/import-mock-data.ts <file.json> [--dry-run]')
  process.exit(2)
}

class ApiFail extends Error {
  status: number
  code: string | undefined
  constructor(status: number, code: string | undefined, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

let token = process.env.ADMIN_TOKEN ?? ''

async function call<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}/api${url}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) {
    let problem: { code?: string; detail?: string; title?: string } = {}
    try {
      problem = JSON.parse(text)
    } catch {
      // thân rỗng hoặc không phải JSON
    }
    throw new ApiFail(res.status, problem.code, problem.detail ?? problem.title ?? `HTTP ${res.status}`)
  }
  return (text ? JSON.parse(text) : undefined) as T
}

// ---------- Báo cáo ----------

const report: Record<string, { created: number; updated: number; skipped: number; failed: number }> = {}
const notes: string[] = []
function count(section: string, kind: 'created' | 'updated' | 'skipped' | 'failed') {
  report[section] ??= { created: 0, updated: 0, skipped: 0, failed: 0 }
  report[section][kind]++
}
function fail(section: string, what: string, error: unknown) {
  count(section, 'failed')
  notes.push(`[${section}] ${what}: ${error instanceof Error ? error.message : String(error)}`)
}

// ---------- Thành viên ----------

const stable = (v: unknown): string =>
  JSON.stringify(v, (_k, value: unknown) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)))
      : value,
  )

/** Chỉ các trường của MemberInput; bỏ id, ảnh, ngày tạo... */
function toInput(m: StoredMember) {
  return {
    fullName: m.fullName,
    gender: m.gender ?? null,
    tabooName: m.tabooName ?? null,
    labels: m.labels ?? [],
    biography: m.biography ?? null,
    phone: m.phone ?? null,
    email: m.email ?? null,
    birth: m.birth ?? null,
    isDeceased: m.isDeceased ?? false,
    deathSolar: m.deathSolar ?? null,
    deathLunar: m.deathLunar ?? null,
    memorialOverride: m.memorialOverride ?? null,
    burialPlace: m.burialPlace ?? null,
  }
}

/** Hồ sơ gốc của người seed, đúng như backend gieo (Flyway V7). */
function seedInput(s: SeedMember) {
  return toInput({
    id: 0,
    fullName: s.fullName,
    isDeceased: s.isDeceased,
    deathSolar: s.deathSolar ?? null,
    deathLunar: s.deathLunar ? { ...s.deathLunar, year: s.deathLunar.year ?? null } : null,
    burialPlace: s.burialPlace ?? null,
  })
}

async function listRealMembers(): Promise<{ id: number; fullName: string }[]> {
  const out: { id: number; fullName: string }[] = []
  for (let page = 0; ; page++) {
    const res = await call<{ items: { id: number; fullName: string }[]; totalPages: number }>(
      'GET',
      `/members?size=100&page=${page}`,
    )
    out.push(...res.items)
    if (page + 1 >= res.totalPages) return out
  }
}

// ---------- Chạy ----------

const dump = JSON.parse(readFileSync(file, 'utf8')) as Dump
if (dump.version !== 1 || !Array.isArray(dump.members) || !Array.isArray(dump.tree?.nodes)) {
  console.error('File không đúng định dạng "Dữ liệu tạm" (version 1).')
  process.exit(2)
}
const seed = JSON.parse(
  readFileSync(path.join(import.meta.dirname, '../../../shared/fixtures/seed/members.json'), 'utf8'),
) as SeedMember[]

if (!token && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const login = await call<{ accessToken: string }>('POST', '/auth/login', {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  })
  token = login.accessToken
}
if (!token) {
  console.error('Thiếu ADMIN_TOKEN hoặc ADMIN_EMAIL + ADMIN_PASSWORD.')
  process.exit(2)
}

console.log(`${dryRun ? '[CHẠY THỬ] ' : ''}Nhập ${file} vào ${BASE}`)

const real = await listRealMembers()
const realById = new Map(real.map((m) => [m.id, m]))
// Người ngoài seed đã có ở máy thật, khớp theo họ tên; mỗi người trong file dùng tối đa một bản
const extras = new Map<string, number[]>()
for (const m of real.filter((m) => m.id > seed.length)) {
  extras.set(m.fullName, [...(extras.get(m.fullName) ?? []), m.id])
}

const idMap = new Map<number, number>() // id trong file -> id ở máy thật (âm khi chạy thử, chưa tạo)
for (const m of [...dump.members].sort((a, b) => a.id - b.id)) {
  try {
    if (m.id <= seed.length) {
      const seedMember = seed[m.id - 1]
      if (realById.get(m.id)?.fullName !== seedMember.fullName) {
        throw new Error(`id ${m.id} ở máy thật không phải "${seedMember.fullName}" (seed lệch)`)
      }
      idMap.set(m.id, m.id)
      if (stable(toInput(m)) === stable(seedInput(seedMember))) {
        count('Thành viên', 'skipped')
      } else if (dryRun) {
        count('Thành viên', 'updated')
      } else {
        await call('PUT', `/members/${m.id}`, toInput(m))
        count('Thành viên', 'updated')
      }
      continue
    }
    const existing = extras.get(m.fullName)?.shift()
    if (existing !== undefined) {
      idMap.set(m.id, existing)
      count('Thành viên', 'skipped')
    } else if (dryRun) {
      idMap.set(m.id, -m.id)
      count('Thành viên', 'created')
    } else {
      const created = await call<{ id: number }>('POST', '/members', toInput(m))
      idMap.set(m.id, created.id)
      count('Thành viên', 'created')
    }
  } catch (error) {
    fail('Thành viên', `#${m.id} ${m.fullName}`, error)
  }
}
const seedKept = new Set(dump.members.map((m) => m.id))
for (let id = 1; id <= seed.length; id++) {
  if (!seedKept.has(id)) notes.push(`[Thành viên] #${id} ${seed[id - 1].fullName} đã bị xóa trong dữ liệu tạm, không xóa ở máy thật.`)
}

// ---------- Người thân ----------

for (const r of dump.relatives ?? []) {
  const from = idMap.get(r.memberId)
  const to = idMap.get(r.relativeMemberId)
  const what = `${r.memberId} -> ${r.relativeMemberId} "${r.label}"`
  if (from === undefined || to === undefined) {
    fail('Người thân', what, new Error('thành viên không có ở máy thật'))
    continue
  }
  if (dryRun) {
    count('Người thân', 'created')
    continue
  }
  try {
    await call('POST', `/members/${from}/relatives`, { relativeMemberId: to, label: r.label })
    count('Người thân', 'created')
  } catch (error) {
    if (error instanceof ApiFail && error.code === 'RELATIVE_EXISTS') count('Người thân', 'skipped')
    else fail('Người thân', what, error)
  }
}

// ---------- Sự kiện chung ----------

const eventKey = (e: StoredEvent) =>
  [e.calendar, e.year ?? '', e.month, e.day, e.leap ?? false, e.title].join('|')
const realEvents = new Set((await call<StoredEvent[]>('GET', '/events')).map(eventKey))
for (const e of dump.events ?? []) {
  if (realEvents.has(eventKey(e))) {
    count('Sự kiện', 'skipped')
    continue
  }
  if (dryRun) {
    count('Sự kiện', 'created')
    continue
  }
  try {
    await call('POST', '/events', {
      title: e.title,
      description: e.description ?? null,
      calendar: e.calendar,
      day: e.day,
      month: e.month,
      year: e.year ?? null,
      leap: e.leap ?? false,
    })
    count('Sự kiện', 'created')
  } catch (error) {
    fail('Sự kiện', e.title, error)
  }
}

// ---------- Cây ----------

type RealNode = { id: number }
const nodes = dump.tree.nodes
const spouseRows = dump.tree.spouses ?? []
const spouseNodeIds = new Set(spouseRows.map((s) => s.spouseNodeId))
const bySort = (a: StoredNode, b: StoredNode) => a.sortOrder - b.sortOrder || a.id - b.id
const nodeById = new Map(nodes.map((n) => [n.id, n]))
const childrenOf = new Map<number, StoredNode[]>()
for (const n of nodes) {
  if (n.parentNodeId !== null) childrenOf.set(n.parentNodeId, [...(childrenOf.get(n.parentNodeId) ?? []), n])
}
const spousesOf = new Map<number, StoredSpouse[]>()
for (const s of spouseRows) spousesOf.set(s.nodeId, [...(spousesOf.get(s.nodeId) ?? []), s])
const roots = nodes.filter((n) => n.parentNodeId === null && !spouseNodeIds.has(n.id)).sort(bySort)

const nodeMap = new Map<number, number>() // ô trong file -> ô ở máy thật
let placeholder: number | null = null // thành viên tạm để dựng ô trống (API chỉ tạo ô khi có người)

async function memberFor(n: StoredNode): Promise<number> {
  if (n.memberId === null) {
    placeholder ??= (await call<{ id: number }>('POST', '/members', { fullName: 'Ô trống (tạm)', isDeceased: false })).id
    return placeholder
  }
  const id = idMap.get(n.memberId)
  if (id === undefined) throw new Error(`thành viên ${n.memberId} không có ở máy thật`)
  return id
}

/** Ô vừa tạo bằng người tạm thì gỡ người ra để thành ô trống đúng như trong file. */
async function settle(n: StoredNode, created: RealNode) {
  if (n.memberId === null) await call('DELETE', `/tree/nodes/${created.id}/member`)
  nodeMap.set(n.id, created.id)
}

async function build(parent: StoredNode, parentReal: number) {
  const kids = (childrenOf.get(parent.id) ?? []).sort(bySort)
  const made: StoredNode[] = []
  const addChild = async (k: StoredNode, coParent?: number) => {
    try {
      const created = await call<RealNode>('POST', `/tree/nodes/${parentReal}/children`, {
        memberId: await memberFor(k),
        ...(coParent !== undefined && { coParentNodeId: coParent }),
      })
      await settle(k, created)
      made.push(k)
      count('Cây', 'created')
    } catch (error) {
      fail('Cây', `ô ${k.id} (và nhánh dưới)`, error)
    }
  }

  // Con một mình cha/mẹ phải tạo trước khi có vợ/chồng, vì có đúng 1 vợ/chồng thì API tự nhận làm cặp
  for (const k of kids.filter((k) => k.coParentNodeId === null)) await addChild(k)
  for (const s of (spousesOf.get(parent.id) ?? []).sort((a, b) => a.order - b.order)) {
    const sn = nodeById.get(s.spouseNodeId)
    if (!sn) continue
    try {
      const created = await call<RealNode>('POST', `/tree/nodes/${parentReal}/spouses`, { memberId: await memberFor(sn) })
      await settle(sn, created)
      count('Cây', 'created')
    } catch (error) {
      fail('Cây', `ô vợ/chồng ${sn.id}`, error)
    }
  }
  for (const k of kids.filter((k) => k.coParentNodeId !== null)) {
    await addChild(k, nodeMap.get(k.coParentNodeId as number))
  }

  // Trả anh em về đúng thứ tự trong file (đang theo thứ tự tạo) bằng các phép đổi chỗ kề nhau
  const current = made.map((k) => k.id)
  const want = kids.filter((k) => made.includes(k)).map((k) => k.id)
  for (let i = 0; i < want.length; i++) {
    for (let j = current.indexOf(want[i]); j > i; j--) {
      try {
        await call('PUT', `/tree/nodes/${nodeMap.get(current[j])}/order`, { direction: 'LEFT' })
      } catch (error) {
        fail('Cây', `đổi thứ tự ô ${current[j]}`, error)
      }
      ;[current[j - 1], current[j]] = [current[j], current[j - 1]]
    }
  }

  for (const k of made) await build(k, nodeMap.get(k.id) as number)
}

if (nodes.length === 0) {
  notes.push('[Cây] File không có ô nào.')
} else if (dryRun) {
  const missing = nodes.filter((n) => n.memberId !== null && !idMap.has(n.memberId))
  report['Cây'] = { created: nodes.length - missing.length, updated: 0, skipped: 0, failed: missing.length }
  for (const n of missing) notes.push(`[Cây] ô ${n.id}: thành viên ${n.memberId} không có ở máy thật`)
  notes.push(`[Cây] ${nodes.filter((n) => n.memberId === null).length} ô trống sẽ dựng qua thành viên tạm.`)
} else if ((await call<{ nodes: unknown[] }>('GET', '/tree')).nodes.length > 0) {
  report['Cây'] = { created: 0, updated: 0, skipped: nodes.length, failed: 0 }
  notes.push('[Cây] Cây ở máy thật không trống nên bỏ qua (xóa cây thật rồi chạy lại nếu muốn nhập).')
} else {
  for (const r of roots) {
    try {
      const created = await call<RealNode>('POST', '/tree/roots', { memberId: await memberFor(r) })
      await settle(r, created)
      count('Cây', 'created')
      await build(r, created.id)
    } catch (error) {
      fail('Cây', `gốc ${r.id} (và nhánh dưới)`, error)
    }
  }
  if (placeholder !== null) {
    try {
      await call('DELETE', `/members/${placeholder}`)
    } catch (error) {
      notes.push(`[Cây] Chưa xóa được thành viên tạm "Ô trống (tạm)" (id ${placeholder}), hãy xóa tay: ${(error as Error).message}`)
    }
  }
}

// ---------- Tổng kết ----------

for (const [name, n] of [
  ['Đề xuất', dump.proposals],
  ['Liên kết "Tôi là ai"', dump.links],
  ['Yêu cầu liên kết', dump.linkRequests],
  ['Thông báo', dump.notifications],
  ['Tệp đính kèm', dump.attachments],
  ['Thành viên đã xóa', dump.deleted],
] as const) {
  if (n?.length) notes.push(`[Không chuyển] ${n.length} ${name} (nhập lại bằng tay nếu cần).`)
}
console.table(report)
for (const line of notes) console.log(line)
if (Object.values(report).some((r) => r.failed > 0)) process.exitCode = 1
