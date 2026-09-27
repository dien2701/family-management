// /api/members: xem (GET), thêm (POST), sửa (PUT), xóa (DELETE). Luật theo shared/api/openapi.yaml, IDEA §6.1
// và DECISIONS #58, #62, #66: mọi tài khoản đã duyệt đều xem được, còn SĐT và email chỉ trả cho Admin và chính chủ.
import type { Me, MemberDetail, MemberPage, MemberSummary, Schemas } from '@/types/api'
import { resolveDualDate, type CalendarKind, type DualDateValue } from '@/utils/lunar'
import { toSearchName } from '@/utils/text'
import type { HandlerContext } from '../context'
import { paginate } from '../paging'
import { mockProblem, validationProblem } from '../problem'
import type { MockRequest, MockRouter, Query } from '../router'
import { removeMemberRelations } from '../links'
import type { StoredMember } from '../store'
import {
  findMember,
  generationIndex,
  isObject,
  requireAdmin,
  requireApproved,
  toSummary,
  type FieldErrors,
} from './common'

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

/** Tuổi tính theo năm: người mất tính đến năm mất; chưa rõ năm sinh hoặc năm mất thì `null`. */
function ageOf(m: StoredMember, currentYear: number): number | null {
  const birthYear = m.birth?.year ?? null
  if (birthYear === null) return null
  const endYear = m.isDeceased ? (m.deathSolar?.year ?? null) : currentYear
  return endYear === null ? null : endYear - birthYear
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
  const member = findMember(context.store, params.id)
  return toDetail(member, generationIndex(context.store), viewer)
}

// ---------- Thêm, sửa, xóa ----------

type MemberInput = Schemas['MemberInput']
type DeathGroup = Pick<
  StoredMember,
  'isDeceased' | 'deathSolar' | 'deathLunar' | 'memorialOverride' | 'burialPlace'
>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Chuỗi tùy chọn: bỏ khoảng trắng thừa, rỗng thì `null`. */
function optionalText(
  raw: unknown,
  field: string,
  max: number,
  label: string,
  errors: FieldErrors,
): string | null {
  if (raw === undefined || raw === null) return null
  if (typeof raw !== 'string') {
    errors.push({ field, message: `${label} phải là chữ.` })
    return null
  }
  const text = raw.trim()
  if (text.length > max) errors.push({ field, message: `${label} tối đa ${max} ký tự.` })
  return text || null
}

const dual = (
  calendar: CalendarKind,
  day: unknown,
  month: unknown,
  year: unknown,
  leap: unknown,
): DualDateValue => ({
  calendar,
  day: day == null ? '' : String(day),
  month: month == null ? '' : String(month),
  year: year == null ? '' : String(year),
  leap: leap === true,
})

/** Ngày sinh: được phép chỉ có năm; `calendar` là lịch tính sinh nhật hằng năm của người này. */
function normalizeBirth(raw: unknown, errors: FieldErrors): StoredMember['birth'] {
  if (raw === undefined || raw === null) return null
  if (!isObject(raw)) {
    errors.push({ field: 'birth', message: 'Ngày sinh không hợp lệ.' })
    return null
  }
  const calendar = raw.calendar === 'LUNAR' ? 'LUNAR' : 'SOLAR'
  const leap = calendar === 'LUNAR' && raw.leap === true
  const result = resolveDualDate(
    dual(calendar === 'LUNAR' ? 'lunar' : 'solar', raw.day, raw.month, raw.year, leap),
    { allowYearOnly: true },
  )
  switch (result.status) {
    case 'empty':
      return null
    case 'yearOnly':
      return { year: result.year, month: null, day: null, calendar, leap: false }
    case 'full': {
      const d = calendar === 'LUNAR' ? result.lunar : result.solar
      return { year: d.year, month: d.month, day: d.day, calendar, leap }
    }
    case 'invalid':
      errors.push({ field: 'birth', message: result.message })
      return null
    default:
      errors.push({ field: 'birth', message: 'Ngày sinh cần đủ ngày, tháng, năm hoặc chỉ có năm.' })
      return null
  }
}

/**
 * Nhóm "đã mất": chỉ hợp lệ khi đã mất. Ngày mất gửi một trong hai lịch (có cả hai thì dùng dương);
 * có năm thì tự tính lịch còn lại, âm không năm thì không có ngày dương.
 */
function normalizeDeathGroup(input: Partial<MemberInput>, errors: FieldErrors): DeathGroup {
  const isDeceased = input.isDeceased === true
  const burialPlace = optionalText(input.burialPlace, 'burialPlace', 300, 'Nơi an táng', errors)
  const group: DeathGroup = {
    isDeceased,
    deathSolar: null,
    deathLunar: null,
    memorialOverride: null,
    burialPlace: null,
  }
  const { deathSolar, deathLunar, memorialOverride } = input
  if (!isDeceased) {
    if (deathSolar || deathLunar || memorialOverride || burialPlace) {
      errors.push({
        field: 'isDeceased',
        message: 'Ngày mất, ngày giỗ và nơi an táng chỉ nhập được khi đã qua đời.',
      })
    }
    return group
  }
  group.burialPlace = burialPlace

  if (deathSolar) {
    const r = resolveDualDate(dual('solar', deathSolar.day, deathSolar.month, deathSolar.year, false))
    if (r.status === 'full') {
      group.deathSolar = r.solar
      group.deathLunar = { ...r.lunar }
    } else {
      errors.push({
        field: 'deathSolar',
        message: r.status === 'invalid' ? r.message : 'Ngày mất dương cần đủ ngày, tháng, năm.',
      })
    }
  } else if (deathLunar) {
    const r = resolveDualDate(
      dual('lunar', deathLunar.day, deathLunar.month, deathLunar.year, deathLunar.leap),
      { allowNoYear: true },
    )
    if (r.status === 'full') {
      group.deathSolar = r.solar
      group.deathLunar = { ...r.lunar }
    } else if (r.status === 'lunarMonthDay') {
      group.deathLunar = { ...r.monthDay, year: null }
    } else {
      errors.push({
        field: 'deathLunar',
        message:
          r.status === 'invalid'
            ? r.message
            : 'Ngày mất âm cần đủ ngày, tháng, năm hoặc chỉ ngày/tháng.',
      })
    }
  }

  if (memorialOverride) {
    const { day, month } = memorialOverride
    const ok =
      Number.isInteger(day) && Number.isInteger(month) && day >= 1 && day <= 30 && month >= 1 && month <= 12
    if (ok) group.memorialOverride = { day, month }
    else {
      errors.push({
        field: 'memorialOverride',
        message: 'Ngày giỗ ghi đè cần ngày 1–30 và tháng 1–12 âm lịch.',
      })
    }
  }
  return group
}

/** Kiểm tra body, trả các trường hồ sơ đã chuẩn hóa (chưa gồm id, ảnh, mốc thời gian). */
function parseMemberInput(body: unknown) {
  const errors: FieldErrors = []
  if (!isObject(body)) {
    throw validationProblem([{ field: 'fullName', message: 'Thiếu nội dung hồ sơ.' }])
  }
  const input = body as Partial<MemberInput>

  const fullName = typeof input.fullName === 'string' ? input.fullName.trim() : ''
  if (!fullName) errors.push({ field: 'fullName', message: 'Vui lòng nhập họ tên.' })
  else if (fullName.length > 200) {
    errors.push({ field: 'fullName', message: 'Họ tên tối đa 200 ký tự.' })
  }

  let gender: StoredMember['gender'] = null
  if (input.gender === 'M' || input.gender === 'F') gender = input.gender
  else if (input.gender !== undefined && input.gender !== null) {
    errors.push({ field: 'gender', message: 'Giới tính chỉ nhận Nam, Nữ hoặc để trống.' })
  }

  const email = optionalText(input.email, 'email', 254, 'Email', errors)
  if (email && !EMAIL.test(email)) errors.push({ field: 'email', message: 'Email không hợp lệ.' })

  let labels: string[] = []
  if (input.labels !== undefined) {
    if (!Array.isArray(input.labels) || input.labels.some((l) => typeof l !== 'string')) {
      errors.push({ field: 'labels', message: 'Nhãn phải là danh sách chữ.' })
    } else {
      labels = [...new Set(input.labels.map((l) => l.trim()).filter(Boolean))]
      if (labels.length > 20 || labels.some((l) => l.length > 50)) {
        errors.push({ field: 'labels', message: 'Tối đa 20 nhãn, mỗi nhãn tối đa 50 ký tự.' })
      }
    }
  }

  const fields = {
    fullName,
    gender,
    labels,
    tabooName: optionalText(input.tabooName, 'tabooName', 200, 'Tên húy', errors),
    biography: optionalText(input.biography, 'biography', 5000, 'Tiểu sử', errors),
    phone: optionalText(input.phone, 'phone', 30, 'Số điện thoại', errors),
    email,
    birth: normalizeBirth(input.birth, errors),
    ...normalizeDeathGroup(input, errors),
  }
  if (errors.length) throw validationProblem(errors)
  return fields
}

const deathGroupOf = (m: StoredMember): DeathGroup => ({
  isDeceased: m.isDeceased,
  deathSolar: m.deathSolar ?? null,
  deathLunar: m.deathLunar ?? null,
  memorialOverride: m.memorialOverride ?? null,
  burialPlace: m.burialPlace ?? null,
})

async function createMember({ body }: MockRequest, context: HandlerContext): Promise<MemberDetail> {
  const viewer = await requireApproved(context)
  requireAdmin(viewer)
  const fields = parseMemberInput(body)
  const { store } = context
  const now = new Date().toISOString()
  const member: StoredMember = {
    id: store.members.reduce((max, m) => Math.max(max, m.id), 0) + 1,
    ...fields,
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
  }
  store.members.push(member)
  context.save()
  return toDetail(member, generationIndex(store), viewer)
}

async function updateMember(
  { params, body }: MockRequest,
  context: HandlerContext,
): Promise<MemberDetail> {
  const viewer = await requireApproved(context)
  const member = findMember(context.store, params.id)
  const isAdmin = viewer.systemRole === 'ADMIN'
  if (!isAdmin && viewer.memberId !== member.id) {
    throw mockProblem(403, 'FORBIDDEN', 'Bạn chỉ được sửa hồ sơ của chính mình.')
  }
  const fields = parseMemberInput(body)
  // User tự sửa hồ sơ thì không được đổi nhóm "đã mất" (DECISIONS #76)
  if (!isAdmin) {
    const current = normalizeDeathGroup(deathGroupOf(member), [])
    const next = deathGroupOf({ ...member, ...fields })
    if (JSON.stringify(current) !== JSON.stringify(next)) {
      throw mockProblem(
        403,
        'DEATH_FIELDS_ADMIN_ONLY',
        'Các thông tin về việc đã mất chỉ Admin được sửa.',
      )
    }
  }
  Object.assign(member, fields, { updatedAt: new Date().toISOString() })
  context.save()
  return toDetail(member, generationIndex(context.store), viewer)
}

async function deleteMember({ params }: MockRequest, context: HandlerContext): Promise<void> {
  const viewer = await requireApproved(context)
  requireAdmin(viewer)
  const { store } = context
  const member = findMember(store, params.id)
  if (store.tree.nodes.some((n) => n.memberId === member.id)) {
    throw mockProblem(
      409,
      'MEMBER_ON_TREE',
      'Người này đang có trên cây gia phả. Hãy gỡ người này khỏi cây trước khi xóa.',
    )
  }
  // Dọn người thân ở cả hai phía, gỡ liên kết tài khoản (tài khoản vẫn còn); bản sao để Đợt 23 cho xem lại
  const relations = removeMemberRelations(store, member.id)
  store.deleted = [
    ...(store.deleted ?? []),
    { deletedAt: new Date().toISOString(), deletedBy: viewer.id ?? null, member, relations },
  ]
  store.members = store.members.filter((m) => m.id !== member.id)
  context.save()
}

export function registerMemberHandlers(router: MockRouter): void {
  router.on('GET', '/members', listMembers)
  router.on('GET', '/members/:id', getMember)
  router.on('POST', '/members', createMember)
  router.on('PUT', '/members/:id', updateMember)
  router.on('DELETE', '/members/:id', deleteMember)
}
