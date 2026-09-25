// Sinh các lần xảy ra của giỗ, sinh nhật và sự kiện chung trong một khoảng ngày dương (IDEA §6.5, §7).
// Hàm thuần: không đọc giờ máy, không gọi API. Ngày âm dùng quy tắc của `anniversaryRules` (ngày ghi đè,
// tháng nhuận, tháng thiếu), giống bản Java.
import {
  MAX_YEAR,
  MIN_YEAR,
  daysInMonth,
  daysInSolarMonth,
  firstDayOfMonth,
  fromJdn,
  isValidSolar,
  lunarOccurrence,
  solarOccurrence,
  toIso,
  toJdn,
  toLunar,
  toSolar,
  type LunarMonthDay,
  type SolarDate,
} from '@/utils/lunar'
import type {
  Occurrence,
  OccurrenceEvent,
  OccurrenceLunar,
  OccurrenceMember,
  OccurrenceSources,
  OccurrenceType,
} from './types'

const TYPE_ORDER: Record<OccurrenceType, number> = { MEMORIAL: 0, BIRTHDAY: 1, CUSTOM: 2 }

/** Chạy `fn`; ngày ngoài khoảng lịch hỗ trợ hoặc không tồn tại thì bỏ qua thay vì làm hỏng cả danh sách. */
function safe<T>(fn: () => T): T | null {
  try {
    return fn()
  } catch {
    return null
  }
}

const clampSolar = (d: SolarDate): SolarDate =>
  d.year < MIN_YEAR
    ? { year: MIN_YEAR, month: 1, day: 1 }
    : d.year > MAX_YEAR
      ? { year: MAX_YEAR, month: 12, day: 31 }
      : d

/** Số ngày từ `today` đến `date` (âm là đã qua). */
export const daysBetween = (today: SolarDate, date: SolarDate): number => toJdn(date) - toJdn(today)

type Range = { from: number; to: number }
type Years = { solar: number[]; lunar: number[] }
type Hit = { solar: SolarDate; lunar: OccurrenceLunar }

const inRange = (range: Range, solar: SolarDate) => {
  const jdn = toJdn(solar)
  return jdn >= range.from && jdn <= range.to
}

function make(
  base: Pick<Occurrence, 'type' | 'title' | 'description' | 'memberId' | 'eventId' | 'ordinal'>,
  hit: Hit,
): Occurrence {
  const id = base.memberId ?? base.eventId
  return { ...base, eventKey: `${base.type}:${id}:${toIso(hit.solar)}`, ...hit }
}

// ---------------------------------------------------------------- Giỗ

/** Ngày/tháng âm của ngày mất và năm âm mất (nếu biết). Chưa có ngày mất mà có ngày giỗ ghi đè thì lấy ngày ghi đè. */
function memorialBase(m: OccurrenceMember): { monthDay: LunarMonthDay; year: number | null } | null {
  if (!m.isDeceased) return null
  if (m.deathLunar) {
    const { month, day, leap, year } = m.deathLunar
    return { monthDay: { month, day, leap }, year: year ?? null }
  }
  if (m.deathSolar) {
    const solar = m.deathSolar
    const l = safe(() => toLunar(solar))
    if (l) return { monthDay: { month: l.month, day: l.day, leap: l.leap }, year: l.year }
  }
  const o = m.memorialOverride
  return o ? { monthDay: { month: o.month, day: o.day, leap: false }, year: null } : null
}

function memorials(m: OccurrenceMember, years: Years, range: Range): Occurrence[] {
  const base = memorialBase(m)
  if (!base) return []
  // Ngày ghi đè luôn là tháng thường
  const override = m.memorialOverride && { ...m.memorialOverride, leap: false }
  const out: Occurrence[] = []
  for (const year of years.lunar) {
    // Năm mất hoặc trước đó chưa có giỗ; giỗ đầu là năm sau
    if (base.year !== null && year <= base.year) continue
    const lunar = safe(() => lunarOccurrence(year, base.monthDay, override))
    const solar = lunar && safe(() => toSolar(lunar))
    if (!lunar || !solar || !inRange(range, solar)) continue
    out.push(
      make(
        {
          type: 'MEMORIAL',
          title: `Giỗ ${m.fullName}`,
          description: null,
          memberId: m.id,
          eventId: null,
          ordinal: base.year === null ? null : year - base.year,
        },
        { solar, lunar },
      ),
    )
  }
  return out
}

// ---------------------------------------------------------------- Ngày lặp hằng năm

type Repeating = { calendar: 'SOLAR' | 'LUNAR'; month: number; day: number; leap: boolean }

/** Lần xảy ra trong năm dương `year` (lịch dương) hoặc năm âm `year` (lịch âm). */
function yearly(r: Repeating, year: number): Hit | null {
  if (r.calendar === 'SOLAR') {
    // 29/2 vẫn hợp lệ ở đây (dời sang 28/2 năm không nhuận); kiểm bằng một năm nhuận
    if (!isValidSolar({ year: 2000, month: r.month, day: r.day })) return null
    const solar = solarOccurrence(year, r.month, r.day)
    const lunar = safe(() => toLunar(solar))
    return lunar && { solar, lunar }
  }
  const lunar = safe(() => lunarOccurrence(year, { month: r.month, day: r.day, leap: r.leap }))
  const solar = lunar && safe(() => toSolar(lunar))
  return lunar && solar ? { solar, lunar } : null
}

// ---------------------------------------------------------------- Sinh nhật

function birthdays(m: OccurrenceMember, years: Years, range: Range): Occurrence[] {
  const b = m.birth
  if (m.isDeceased || !b || b.month == null || b.day == null) return []
  const r: Repeating = { calendar: b.calendar, month: b.month, day: b.day, leap: b.leap === true }
  const out: Occurrence[] = []
  for (const year of b.calendar === 'SOLAR' ? years.solar : years.lunar) {
    // Năm sinh hoặc trước đó chưa có sinh nhật
    if (b.year != null && year <= b.year) continue
    const hit = yearly(r, year)
    if (!hit || !inRange(range, hit.solar)) continue
    out.push(
      make(
        {
          type: 'BIRTHDAY',
          title: `Sinh nhật ${m.fullName}`,
          description: null,
          memberId: m.id,
          eventId: null,
          ordinal: b.year == null ? null : year - b.year,
        },
        hit,
      ),
    )
  }
  return out
}

// ---------------------------------------------------------------- Sự kiện chung

function customs(e: OccurrenceEvent, years: Years, range: Range): Occurrence[] {
  const r: Repeating = { calendar: e.calendar, month: e.month, day: e.day, leap: e.leap }
  const hits: Hit[] = []
  if (e.year === null) {
    for (const year of e.calendar === 'SOLAR' ? years.solar : years.lunar) {
      const hit = yearly(r, year)
      if (hit) hits.push(hit)
    }
  } else if (e.calendar === 'SOLAR') {
    const solar = { year: e.year, month: e.month, day: e.day }
    const lunar = isValidSolar(solar) ? safe(() => toLunar(solar)) : null
    if (lunar) hits.push({ solar, lunar })
  } else {
    // Một lần: ngày âm đúng như nhập, kể cả tháng nhuận
    const lunar = { year: e.year, month: e.month, day: e.day, leap: e.leap }
    const solar = safe(() => toSolar(lunar))
    if (solar) hits.push({ solar, lunar })
  }
  return hits
    .filter((hit) => inRange(range, hit.solar))
    .map((hit) =>
      make(
        {
          type: 'CUSTOM',
          title: e.title,
          description: e.description,
          memberId: null,
          eventId: e.id,
          ordinal: null,
        },
        hit,
      ),
    )
}

// ---------------------------------------------------------------- Điểm vào

const span = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i)

/**
 * Mọi lần xảy ra có ngày dương trong `[from, to]` (gồm cả hai đầu), xếp theo ngày, rồi Giỗ, Sinh nhật,
 * Sự kiện chung, rồi theo tên.
 */
export function generateOccurrences(
  sources: OccurrenceSources,
  from: SolarDate,
  to: SolarDate,
): Occurrence[] {
  const range: Range = { from: toJdn(from), to: toJdn(to) }
  if (range.from > range.to) return []
  const lo = clampSolar(from)
  const hi = clampSolar(to)
  // Một năm âm trải từ Tết đến Tết sau, nên phủ hết các năm âm chạm vào khoảng này
  const years: Years = {
    solar: span(from.year, to.year),
    lunar: span(safe(() => toLunar(lo).year) ?? lo.year, safe(() => toLunar(hi).year) ?? hi.year),
  }
  const out = [
    ...sources.members.flatMap((m) => [...memorials(m, years, range), ...birthdays(m, years, range)]),
    ...sources.events.flatMap((e) => customs(e, years, range)),
  ]
  return out.sort(
    (a, b) =>
      toJdn(a.solar) - toJdn(b.solar) ||
      TYPE_ORDER[a.type] - TYPE_ORDER[b.type] ||
      a.title.localeCompare(b.title, 'vi') ||
      a.eventKey.localeCompare(b.eventKey),
  )
}

/** Các ngày (dương kèm âm) của một tháng dương hoặc một tháng âm, theo thứ tự ngày. Ném lỗi nếu ngoài khoảng hỗ trợ. */
export function monthDates(
  mode: 'solar' | 'lunar',
  year: number,
  month: number,
  leap: boolean,
): Hit[] {
  const first: SolarDate =
    mode === 'solar' ? { year, month, day: 1 } : firstDayOfMonth(year, month, leap)
  const count = mode === 'solar' ? daysInSolarMonth(year, month) : daysInMonth(year, month, leap)
  const startJdn = toJdn(first)
  return Array.from({ length: count }, (_, i) => {
    const solar = fromJdn(startJdn + i)
    return { solar, lunar: toLunar(solar) }
  })
}
