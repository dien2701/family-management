// /api/events (sự kiện chung) và /api/calendar/{upcoming,month,recent} (IDEA §6.5, DECISIONS #65). Mọi tài khoản đã
// duyệt xem được, chỉ Admin ghi sự kiện. Giỗ và sinh nhật không lưu riêng: sinh từ hồ sơ thành viên bằng
// `utils/occurrences`, dùng chung với giao diện.
import type { CalendarDay, CalendarMonth, CalendarOccurrence, CustomEvent } from '@/types/api'
import {
  fromJdn,
  resolveDualDate,
  toJdn,
  type CalendarKind,
  type SolarDate,
} from '@/utils/lunar'
import {
  daysBetween,
  generateOccurrences,
  monthDates,
  type Occurrence,
  type OccurrenceType,
} from '@/utils/occurrences'
import type { HandlerContext } from '../context'
import { mockProblem, validationProblem } from '../problem'
import type { MockRequest, MockRouter } from '../router'
import type { MockStore, StoredEvent } from '../store'
import { isObject, positiveInt, requireAdmin, requireApproved, type FieldErrors } from './common'

const eventsOf = (store: MockStore): StoredEvent[] => (store.events ??= [])

const MAX_TITLE = 200
const MAX_DESCRIPTION = 2000
const UPCOMING_DAYS = [7, 15, 30, 90, 365]
const EVENT_TYPES: readonly OccurrenceType[] = ['MEMORIAL', 'BIRTHDAY', 'CUSTOM']

// ---------------------------------------------------------------- Sự kiện chung

function findEvent(store: MockStore, rawId: unknown): StoredEvent {
  const id = positiveInt(rawId)
  const event = id === null ? undefined : eventsOf(store).find((e) => e.id === id)
  if (!event) throw mockProblem(404, 'EVENT_NOT_FOUND', 'Không tìm thấy sự kiện này.')
  return event
}

const intOrNull = (raw: unknown): number | null =>
  typeof raw === 'number' && Number.isInteger(raw) ? raw : null

type EventFields = Pick<
  CustomEvent,
  'title' | 'description' | 'calendar' | 'day' | 'month' | 'year' | 'leap'
>

/** Kiểm tra body theo hợp đồng và quy tắc lịch (ngày âm/dương có thật, năm trong khoảng hỗ trợ). */
function parseEvent(body: unknown): EventFields {
  const input = isObject(body) ? body : {}
  const errors: FieldErrors = []

  const title = typeof input.title === 'string' ? input.title.trim() : ''
  if (!title) errors.push({ field: 'title', message: 'Vui lòng nhập tên sự kiện.' })
  else if (title.length > MAX_TITLE) {
    errors.push({ field: 'title', message: `Tên sự kiện tối đa ${MAX_TITLE} ký tự.` })
  }

  let description: string | null = null
  if (typeof input.description === 'string' && input.description.trim()) {
    description = input.description.trim()
    if (description.length > MAX_DESCRIPTION) {
      errors.push({ field: 'description', message: `Ghi chú tối đa ${MAX_DESCRIPTION} ký tự.` })
    }
  }

  const calendar = input.calendar === 'LUNAR' ? 'LUNAR' : input.calendar === 'SOLAR' ? 'SOLAR' : null
  if (!calendar) errors.push({ field: 'calendar', message: 'Chọn lịch dương hoặc âm.' })

  const day = intOrNull(input.day)
  const month = intOrNull(input.month)
  const year = input.year === undefined || input.year === null ? null : intOrNull(input.year)
  if (day === null) errors.push({ field: 'day', message: 'Vui lòng nhập ngày.' })
  if (month === null) errors.push({ field: 'month', message: 'Vui lòng nhập tháng.' })
  if (input.year !== undefined && input.year !== null && year === null) {
    errors.push({ field: 'year', message: 'Năm không hợp lệ.' })
  }
  const leap = calendar === 'LUNAR' && input.leap === true

  if (calendar && day !== null && month !== null && !errors.some((e) => e.field === 'year')) {
    const kind: CalendarKind = calendar === 'LUNAR' ? 'lunar' : 'solar'
    const value = {
      calendar: kind,
      day: String(day),
      month: String(month),
      year: year === null ? '' : String(year),
      leap,
    }
    // Không có năm = lặp hằng năm; có năm = một lần (đúng ngày đó, kể cả tháng nhuận)
    const result = resolveDualDate(value, { allowNoYear: true, allowNoYearSolar: true })
    if (result.status === 'invalid') {
      errors.push({ field: result.field, message: result.message })
    } else if (
      result.status !== 'full' &&
      result.status !== 'lunarMonthDay' &&
      result.status !== 'solarMonthDay'
    ) {
      errors.push({ field: 'day', message: 'Ngày không hợp lệ.' })
    }
  }

  if (errors.length || !calendar || day === null || month === null) throw validationProblem(errors)
  return { title, description, calendar, day, month, year, leap }
}

async function listEvents(_: MockRequest, context: HandlerContext): Promise<CustomEvent[]> {
  await requireApproved(context)
  return [...eventsOf(context.store)].sort((a, b) => a.id - b.id)
}

async function getEvent({ params }: MockRequest, context: HandlerContext): Promise<CustomEvent> {
  await requireApproved(context)
  return findEvent(context.store, params.id)
}

async function createEvent({ body }: MockRequest, context: HandlerContext): Promise<CustomEvent> {
  requireAdmin(await requireApproved(context))
  const fields = parseEvent(body)
  const events = eventsOf(context.store)
  const now = new Date().toISOString()
  const event: StoredEvent = {
    id: events.reduce((max, e) => Math.max(max, e.id), 0) + 1,
    ...fields,
    createdAt: now,
    updatedAt: now,
  }
  events.push(event)
  context.save()
  return event
}

async function updateEvent(
  { params, body }: MockRequest,
  context: HandlerContext,
): Promise<CustomEvent> {
  requireAdmin(await requireApproved(context))
  const event = findEvent(context.store, params.id)
  Object.assign(event, parseEvent(body), { updatedAt: new Date().toISOString() })
  context.save()
  return event
}

async function deleteEvent({ params }: MockRequest, context: HandlerContext): Promise<void> {
  requireAdmin(await requireApproved(context))
  const event = findEvent(context.store, params.id)
  context.store.events = eventsOf(context.store).filter((e) => e.id !== event.id)
  context.save()
}

// ---------------------------------------------------------------- Lịch

/** Số nguyên từ query (chuỗi hoặc số); vắng thì `fallback`, sai thì `null`. */
function intQuery(raw: unknown, fallback: number): number | null {
  if (raw === undefined || raw === null || raw === '') return fallback
  const n = typeof raw === 'string' && /^-?\d+$/.test(raw) ? Number(raw) : raw
  return typeof n === 'number' && Number.isInteger(n) ? n : null
}

const addDays = (date: SolarDate, days: number): SolarDate => fromJdn(toJdn(date) + days)

function toDto(o: Occurrence, today: SolarDate): CalendarOccurrence {
  return { ...o, daysUntil: daysBetween(today, o.solar) }
}

const sourcesOf = (store: MockStore) => ({ members: store.members, events: eventsOf(store) })

async function upcoming({ query }: MockRequest, context: HandlerContext): Promise<CalendarOccurrence[]> {
  await requireApproved(context)
  const errors: FieldErrors = []
  const days = intQuery(query.days, 30)
  if (days === null || !UPCOMING_DAYS.includes(days)) {
    errors.push({ field: 'days', message: 'Khoảng thời gian chỉ nhận 7, 15, 30, 90 hoặc 365 ngày.' })
  }
  const type = query.type === undefined || query.type === '' ? null : String(query.type)
  if (type !== null && !EVENT_TYPES.includes(type as OccurrenceType)) {
    errors.push({ field: 'type', message: 'Loại sự kiện không hợp lệ.' })
  }
  const sort = query.sort === undefined || query.sort === '' ? 'asc' : String(query.sort)
  if (sort !== 'asc' && sort !== 'desc') errors.push({ field: 'sort', message: 'Cách sắp xếp không hợp lệ.' })
  if (errors.length || days === null) throw validationProblem(errors)

  const today = context.today()
  const list = generateOccurrences(sourcesOf(context.store), today, addDays(today, days))
    .filter((o) => type === null || o.type === type)
    .map((o) => toDto(o, today))
  return sort === 'desc' ? list.reverse() : list
}

async function month({ query }: MockRequest, context: HandlerContext): Promise<CalendarMonth> {
  await requireApproved(context)
  const errors: FieldErrors = []
  const year = intQuery(query.year, NaN)
  const monthNo = intQuery(query.month, NaN)
  if (year === null || Number.isNaN(year)) errors.push({ field: 'year', message: 'Vui lòng nhập năm.' })
  if (monthNo === null || Number.isNaN(monthNo) || monthNo < 1 || monthNo > 12) {
    errors.push({ field: 'month', message: 'Tháng phải từ 1 đến 12.' })
  }
  const mode = query.mode === undefined || query.mode === '' ? 'solar' : String(query.mode)
  if (mode !== 'solar' && mode !== 'lunar') errors.push({ field: 'mode', message: 'Chế độ xem không hợp lệ.' })
  if (errors.length || year === null || monthNo === null) throw validationProblem(errors)
  const leap = mode === 'lunar' && (query.leap === true || query.leap === 'true')

  let dates: ReturnType<typeof monthDates>
  try {
    dates = monthDates(mode as 'solar' | 'lunar', year, monthNo, leap)
  } catch {
    throw validationProblem([
      { field: 'month', message: 'Tháng này không có trong khoảng lịch được hỗ trợ (năm 1900–2100).' },
    ])
  }

  const today = context.today()
  const occurrences = generateOccurrences(
    sourcesOf(context.store),
    dates[0]!.solar,
    dates[dates.length - 1]!.solar,
  )
  const byDay = new Map<number, CalendarOccurrence[]>()
  for (const o of occurrences) {
    const key = toJdn(o.solar)
    byDay.set(key, [...(byDay.get(key) ?? []), toDto(o, today)])
  }
  const days: CalendarDay[] = dates.map((d) => ({
    solar: d.solar,
    lunar: d.lunar,
    occurrences: byDay.get(toJdn(d.solar)) ?? [],
  }))
  return { mode, year, month: monthNo, leap, days }
}

async function recent({ query }: MockRequest, context: HandlerContext): Promise<CalendarOccurrence[]> {
  await requireApproved(context)
  const limit = intQuery(query.limit, 10)
  if (limit === null || limit < 1 || limit > 50) {
    throw validationProblem([{ field: 'limit', message: 'Số lượng phải từ 1 đến 50.' }])
  }
  const today = context.today()
  return generateOccurrences(sourcesOf(context.store), addDays(today, -365), addDays(today, -1))
    .map((o) => toDto(o, today))
    .reverse()
    .slice(0, limit)
}

export function registerCalendarHandlers(router: MockRouter): void {
  router.on('GET', '/events', listEvents)
  router.on('POST', '/events', createEvent)
  router.on('GET', '/events/:id', getEvent)
  router.on('PUT', '/events/:id', updateEvent)
  router.on('DELETE', '/events/:id', deleteEvent)
  router.on('GET', '/calendar/upcoming', upcoming)
  router.on('GET', '/calendar/month', month)
  router.on('GET', '/calendar/recent', recent)
}
