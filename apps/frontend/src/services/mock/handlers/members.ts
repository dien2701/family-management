// GET /api/members và GET /api/members/{id}. Luật theo shared/api/openapi.yaml, IDEA §6.1 và DECISIONS #66:
// mọi tài khoản đã duyệt đều xem được, còn SĐT và email chỉ trả cho Admin và chính chủ.
import type { Me, MemberDetail, MemberPage, MemberSummary } from '@/types/api'
import { toSearchName } from '@/utils/text'
import type { HandlerContext } from '../context'
import { paginate } from '../paging'
import { mockProblem, validationProblem } from '../problem'
import type { MockRequest, MockRouter, Query } from '../router'
import type { MockStore, StoredMember } from '../store'

const SORTS = ['name', 'age', 'created', 'generation'] as const
type Sort = (typeof SORTS)[number]

type Filters = {
  q: string
  sort: Sort
  ageMin: number | null
  ageMax: number | null
  generation: number | null
  deceased: boolean | null
  onTree: boolean | null
  page: number
  size: number
}

type FieldErrors = { field: string; message: string }[]

const blank = (v: unknown) => v === undefined || v === null || v === ''

function intParam(
  query: Query,
  field: string,
  errors: FieldErrors,
  min: number,
  max: number,
): number | null {
  const raw = query[field]
  if (blank(raw)) return null
  const n = Number(raw)
  if (!Number.isInteger(n) || n < min || n > max) {
    errors.push({ field, message: `${field} phải là số nguyên từ ${min} đến ${max}.` })
    return null
  }
  return n
}

function boolParam(query: Query, field: string, errors: FieldErrors): boolean | null {
  const raw = query[field]
  if (blank(raw)) return null
  if (raw === true || raw === 'true') return true
  if (raw === false || raw === 'false') return false
  errors.push({ field, message: `${field} chỉ nhận true hoặc false.` })
  return null
}

function parseFilters(query: Query): Filters {
  const errors: FieldErrors = []
  const q = blank(query.q) ? '' : String(query.q)
  if (q.length > 100) errors.push({ field: 'q', message: 'Từ khóa tối đa 100 ký tự.' })

  let sort: Sort = 'name'
  if (!blank(query.sort)) {
    if ((SORTS as readonly unknown[]).includes(query.sort)) sort = query.sort as Sort
    else errors.push({ field: 'sort', message: `sort chỉ nhận: ${SORTS.join(', ')}.` })
  }

  const filters: Filters = {
    q,
    sort,
    ageMin: intParam(query, 'ageMin', errors, 0, 150),
    ageMax: intParam(query, 'ageMax', errors, 0, 150),
    generation: intParam(query, 'generation', errors, 1, 1000),
    deceased: boolParam(query, 'deceased', errors),
    onTree: boolParam(query, 'onTree', errors),
    page: intParam(query, 'page', errors, 0, 1_000_000) ?? 0,
    size: intParam(query, 'size', errors, 1, 100) ?? 20,
  }
  if (errors.length) throw validationProblem(errors)
  return filters
}

/** Đời = độ sâu của ô chứa người đó trên cây (gốc là đời 1). Chưa có trên cây thì không có trong map. */
function generationIndex(store: MockStore): Map<number, number> {
  const byId = new Map(store.tree.nodes.map((n) => [n.id, n]))
  const result = new Map<number, number>()
  for (const node of store.tree.nodes) {
    if (node.memberId === null) continue
    let depth = 1
    let cursor = node
    const seen = new Set<number>([cursor.id])
    while (cursor.parentNodeId !== null) {
      const parent = byId.get(cursor.parentNodeId)
      if (!parent || seen.has(parent.id)) break
      seen.add(parent.id)
      cursor = parent
      depth++
    }
    result.set(node.memberId, depth)
  }
  return result
}

/** Tuổi tính theo năm: người mất tính đến năm mất; chưa rõ năm sinh hoặc năm mất thì `null`. */
function ageOf(m: StoredMember, currentYear: number): number | null {
  const birthYear = m.birth?.year ?? null
  if (birthYear === null) return null
  const endYear = m.isDeceased ? (m.deathSolar?.year ?? null) : currentYear
  return endYear === null ? null : endYear - birthYear
}

function toSummary(m: StoredMember, generations: Map<number, number>): MemberSummary {
  const generation = generations.get(m.id) ?? null
  return {
    id: m.id,
    fullName: m.fullName,
    gender: m.gender,
    avatarUrl: m.avatarUrl,
    labels: m.labels,
    birthYear: m.birth?.year ?? null,
    isDeceased: m.isDeceased,
    deathYear: m.deathSolar?.year ?? null,
    generation,
    onTree: generation !== null,
    createdAt: m.createdAt,
  }
}

/** SĐT và email chỉ trả cho Admin và chính chủ (DECISIONS #66). */
const canSeeContact = (viewer: Me, memberId: number) =>
  viewer.systemRole === 'ADMIN' || viewer.memberId === memberId

/** Người khác không thấy SĐT/email: bỏ hẳn hai khóa (không để `null`), đúng như hợp đồng. */
function toDetail(m: StoredMember, generations: Map<number, number>, viewer: Me): MemberDetail {
  const { phone, email, ...rest } = m
  return {
    ...toSummary(m, generations),
    ...rest,
    ...(canSeeContact(viewer, m.id) && { phone, email }),
  }
}

const byName = (a: MemberSummary, b: MemberSummary) =>
  a.fullName.localeCompare(b.fullName, 'vi') || a.id - b.id

/** `null` xuống cuối, còn lại so theo `compare`. */
function nullsLast(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return a - b
}

function sortMembers(list: MemberSummary[], sort: Sort): MemberSummary[] {
  const sorted = [...list]
  switch (sort) {
    case 'name':
      return sorted.sort(byName)
    case 'age':
      // Lớn tuổi trước = năm sinh nhỏ trước
      return sorted.sort((a, b) => nullsLast(a.birthYear, b.birthYear) || byName(a, b))
    case 'created':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    case 'generation':
      return sorted.sort((a, b) => nullsLast(a.generation, b.generation) || byName(a, b))
  }
}

async function requireApproved(context: HandlerContext): Promise<Me> {
  const viewer = await context.viewer()
  if (viewer.approvalStatus !== 'APPROVED') {
    throw mockProblem(
      403,
      'ACCOUNT_NOT_APPROVED',
      'Tài khoản của bạn đang chờ Admin duyệt nên chưa xem được dữ liệu gia phả.',
    )
  }
  return viewer
}

async function listMembers({ query }: MockRequest, context: HandlerContext): Promise<MemberPage> {
  await requireApproved(context)
  const f = parseFilters(query)
  const generations = generationIndex(context.store)
  const needle = toSearchName(f.q)
  const currentYear = context.today().year

  const matched = context.store.members.filter((m) => {
    if (needle && !toSearchName(m.fullName).includes(needle)) return false
    if (f.deceased !== null && m.isDeceased !== f.deceased) return false
    const generation = generations.get(m.id) ?? null
    if (f.onTree !== null && (generation !== null) !== f.onTree) return false
    if (f.generation !== null && generation !== f.generation) return false
    if (f.ageMin !== null || f.ageMax !== null) {
      const age = ageOf(m, currentYear)
      if (age === null) return false
      if (f.ageMin !== null && age < f.ageMin) return false
      if (f.ageMax !== null && age > f.ageMax) return false
    }
    return true
  })

  const summaries = matched.map((m) => toSummary(m, generations))
  return paginate(sortMembers(summaries, f.sort), f.page, f.size)
}

async function getMember({ params }: MockRequest, context: HandlerContext): Promise<MemberDetail> {
  const viewer = await requireApproved(context)
  const id = /^\d+$/.test(params.id ?? '') ? Number(params.id) : null
  const member = id === null ? undefined : context.store.members.find((m) => m.id === id)
  if (!member) throw mockProblem(404, 'MEMBER_NOT_FOUND', 'Không tìm thấy thành viên này.')
  return toDetail(member, generationIndex(context.store), viewer)
}

export function registerMemberHandlers(router: MockRouter): void {
  router.on('GET', '/members', listMembers)
  router.on('GET', '/members/:id', getMember)
}
