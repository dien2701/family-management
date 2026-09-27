// Logic thuần của ô nhập ngày Âm/Dương (component DualDateInput): giải mã chuỗi người dùng gõ thành kết quả
// đã kiểm tra, kèm ngày tương ứng ở lịch còn lại. Không đụng React nên test được trực tiếp.
import { lunarOccurrence, solarOccurrence } from './anniversaryRules'
import {
  MAX_YEAR,
  MIN_LUNAR_YEAR,
  MIN_YEAR,
  daysInMonth,
  leapMonth,
  toLunar,
  toSolar,
} from './lunarCalendar'
import { daysInSolarMonth, todayInVietnam } from './solarDate'
import type { LunarDate, LunarMonthDay, SolarDate } from './types'

export type CalendarKind = 'solar' | 'lunar'

/** Giá trị đang gõ. Giữ chuỗi thô để người dùng gõ dở (chưa đủ ngày/tháng/năm) mà ô không bị "sửa" lại. */
export type DualDateValue = {
  calendar: CalendarKind
  day: string
  month: string
  year: string
  /** Chỉ có nghĩa khi `calendar = 'lunar'`. */
  leap: boolean
}

export type DualDateOptions = {
  /** Cho phép chỉ nhập năm (bỏ trống ngày và tháng). */
  allowYearOnly?: boolean
  /** Cho phép chỉ nhập ngày/tháng âm, không có năm (giỗ, sinh nhật âm lặp hằng năm). */
  allowNoYear?: boolean
  /** Cho phép chỉ nhập ngày/tháng dương, không có năm (sự kiện dương lặp hằng năm). */
  allowNoYearSolar?: boolean
  /** Năm âm dùng để minh họa ngày lặp hằng năm; mặc định do người gọi truyền (thường là năm âm hiện tại). */
  referenceLunarYear?: number
}

export type DualDateField = 'day' | 'month' | 'year' | 'leap'

export type DualDateResult =
  | { status: 'empty' }
  | { status: 'incomplete'; message: string }
  | { status: 'invalid'; field: DualDateField; message: string }
  /** Đủ ngày, tháng, năm: có cả hai lịch. `monthDays` là số ngày của tháng âm ấy (29/30). */
  | {
      status: 'full'
      calendar: CalendarKind
      solar: SolarDate
      lunar: LunarDate
      monthDays: number
      yearLeapMonth: number
    }
  | { status: 'yearOnly'; calendar: CalendarKind; year: number }
  /** Ngày/tháng dương không năm: `occurrence` là ngày rơi vào năm dương `year` (29/2 năm không nhuận dời sang 28/2). */
  | {
      status: 'solarMonthDay'
      month: number
      day: number
      year: number
      occurrence: SolarDate
      occurrenceLunar: LunarDate
      movedFromFeb29: boolean
    }
  /** Ngày/tháng âm không năm: `occurrence` là ngày cúng trong năm âm `year` (đã áp quy tắc nhuận và ngày 30). */
  | {
      status: 'lunarMonthDay'
      monthDay: LunarMonthDay
      year: number
      occurrence: LunarDate
      occurrenceSolar: SolarDate
      /** Ngày gốc thuộc tháng nhuận nên cúng vào tháng thường. */
      movedFromLeap: boolean
      /** Ngày 30 nhưng tháng đó năm `year` thiếu nên cúng ngày 29. */
      movedFrom30: boolean
    }

export const emptyDualDate = (calendar: CalendarKind = 'solar'): DualDateValue => ({
  calendar,
  day: '',
  month: '',
  year: '',
  leap: false,
})

export const solarToDualDate = (d: SolarDate): DualDateValue => ({
  calendar: 'solar',
  day: String(d.day),
  month: String(d.month),
  year: String(d.year),
  leap: false,
})

export const lunarToDualDate = (d: LunarDate): DualDateValue => ({
  calendar: 'lunar',
  day: String(d.day),
  month: String(d.month),
  year: String(d.year),
  leap: d.leap,
})

const invalid = (field: DualDateField, message: string): DualDateResult => ({
  status: 'invalid',
  field,
  message,
})

const INCOMPLETE = 'Nhập đủ ngày, tháng và năm để xem ngày tương ứng.'
const monthLabel = (month: number, leap: boolean) => (leap ? `${month} nhuận` : String(month))

export function resolveDualDate(
  value: DualDateValue,
  options: DualDateOptions = {},
): DualDateResult {
  const day = value.day.trim()
  const month = value.month.trim()
  const year = value.year.trim()
  if (!day && !month && !year) return { status: 'empty' }
  if (![day, month, year].every((s) => /^\d*$/.test(s))) {
    return invalid('day', 'Chỉ nhập chữ số.')
  }
  return value.calendar === 'solar'
    ? resolveSolar(day, month, year, options)
    : resolveLunar(day, month, year, value.leap, options)
}

function resolveSolar(
  day: string,
  month: string,
  year: string,
  options: DualDateOptions,
): DualDateResult {
  if (year && !month && !day) {
    return options.allowYearOnly
      ? { status: 'yearOnly', calendar: 'solar', year: Number(year) }
      : incomplete()
  }
  if (!year && month && day && options.allowNoYearSolar) {
    return resolveSolarMonthDay(Number(month), Number(day))
  }
  if (!day || !month || !year) return incomplete()
  const [d, m, y] = [Number(day), Number(month), Number(year)] as const
  if (y < MIN_YEAR || y > MAX_YEAR) {
    return invalid('year', `Chỉ hỗ trợ năm dương từ ${MIN_YEAR} đến ${MAX_YEAR}.`)
  }
  if (m < 1 || m > 12) return invalid('month', 'Tháng dương phải từ 1 đến 12.')
  const max = daysInSolarMonth(y, m)
  if (d < 1 || d > max) {
    return invalid('day', `Tháng ${m} năm ${y} dương lịch chỉ có ${max} ngày.`)
  }
  const solar = { year: y, month: m, day: d }
  const lunar = toLunar(solar)
  return {
    status: 'full',
    calendar: 'solar',
    solar,
    lunar,
    monthDays: daysInMonth(lunar.year, lunar.month, lunar.leap),
    yearLeapMonth: leapMonth(lunar.year),
  }
}

function resolveSolarMonthDay(month: number, day: number): DualDateResult {
  if (month < 1 || month > 12) return invalid('month', 'Tháng dương phải từ 1 đến 12.')
  // 29/2 hợp lệ vì có năm nhuận; kiểm bằng một năm nhuận
  const max = daysInSolarMonth(2000, month)
  if (day < 1 || day > max) {
    return invalid('day', `Tháng ${month} dương lịch không có ngày ${day}.`)
  }
  const year = todayInVietnam().year
  const occurrence = solarOccurrence(year, month, day)
  return {
    status: 'solarMonthDay',
    month,
    day,
    year,
    occurrence,
    occurrenceLunar: toLunar(occurrence),
    movedFromFeb29: occurrence.day !== day,
  }
}

function resolveLunar(
  day: string,
  month: string,
  year: string,
  leap: boolean,
  options: DualDateOptions,
): DualDateResult {
  if (year && !month && !day) {
    return options.allowYearOnly
      ? { status: 'yearOnly', calendar: 'lunar', year: Number(year) }
      : incomplete()
  }
  if (!year && month && day) {
    return options.allowNoYear
      ? resolveMonthDay(Number(month), Number(day), leap, options)
      : incomplete()
  }
  if (!day || !month || !year) return incomplete()
  const [d, m, y] = [Number(day), Number(month), Number(year)] as const
  if (y < MIN_LUNAR_YEAR || y > MAX_YEAR) {
    return invalid('year', `Chỉ hỗ trợ năm âm lịch từ ${MIN_LUNAR_YEAR} đến ${MAX_YEAR}.`)
  }
  if (m < 1 || m > 12) return invalid('month', 'Tháng âm phải từ 1 đến 12.')
  const yearLeap = leapMonth(y)
  if (leap && yearLeap !== m) {
    return invalid(
      'leap',
      `Năm ${y} âm lịch không có tháng ${m} nhuận` +
        (yearLeap === 0 ? ' (năm này không nhuận).' : ` (năm này nhuận tháng ${yearLeap}).`),
    )
  }
  const monthDays = daysInMonth(y, m, leap)
  if (d < 1 || d > 30) return invalid('day', 'Ngày âm phải từ 1 đến 30.')
  if (d > monthDays) {
    return invalid(
      'day',
      `Tháng ${monthLabel(m, leap)} năm ${y} âm lịch chỉ có ${monthDays} ngày, không có ngày ${d}.`,
    )
  }
  const lunar = { year: y, month: m, day: d, leap }
  return {
    status: 'full',
    calendar: 'lunar',
    solar: toSolar(lunar),
    lunar,
    monthDays,
    yearLeapMonth: yearLeap,
  }
}

function resolveMonthDay(
  month: number,
  day: number,
  leap: boolean,
  options: DualDateOptions,
): DualDateResult {
  if (month < 1 || month > 12) return invalid('month', 'Tháng âm phải từ 1 đến 12.')
  if (day < 1 || day > 30) return invalid('day', 'Ngày âm phải từ 1 đến 30.')
  const year = options.referenceLunarYear ?? toLunar(todayInVietnam()).year
  const monthDay = { month, day, leap }
  const occurrence = lunarOccurrence(year, monthDay)
  return {
    status: 'lunarMonthDay',
    monthDay,
    year,
    occurrence,
    occurrenceSolar: toSolar(occurrence),
    movedFromLeap: leap,
    movedFrom30: occurrence.day !== day,
  }
}

const incomplete = (): DualDateResult => ({ status: 'incomplete', message: INCOMPLETE })

/**
 * Đổi cách nhập sang lịch kia. Ngày đã hợp lệ thì đổi luôn số trong ô sang lịch mới,
 * còn lại (đang gõ dở, sai) thì giữ nguyên chữ người dùng gõ.
 */
export function switchCalendar(
  value: DualDateValue,
  to: CalendarKind,
  options: DualDateOptions = {},
): DualDateValue {
  if (value.calendar === to) return value
  const result = resolveDualDate(value, options)
  if (result.status === 'full') {
    return to === 'solar' ? solarToDualDate(result.solar) : lunarToDualDate(result.lunar)
  }
  return { ...value, calendar: to, leap: false }
}
