// Lịch âm Việt Nam theo thuật toán của Hồ Ngọc Đức (công thức thiên văn rút gọn từ Meeus, "Astronomical
// Algorithms", 1998). Bản TS của `vn.giapha.calendar.service.LunarCalendar`: bản Java là nguồn chuẩn, hai bản
// phải cho cùng kết quả với `shared/fixtures/lunar` (DECISIONS #35). Sửa một bên thì sửa bên kia.
//
// Hai điểm khác bản gốc để khớp bảng tiền tính của chính tác giả:
// - Múi giờ: năm âm trước 1968 tính theo UTC+8 (lịch miền Bắc dùng tới Tết Mậu Thân 1968), từ 1968 theo UTC+7.
// - NEW_MOON_FIXES: vài ngày sóc mà công thức rút gọn lệch 1 ngày vì trăng mới sát nửa đêm.
import { fromJdn, parseIso, toJdn } from './solarDate'
import { LunarError, type LunarDate, type SolarDate } from './types'

/** Khoảng năm dương được hỗ trợ (đã đối chiếu). */
export const MIN_YEAR = 1900
export const MAX_YEAR = 2100
/** Năm âm 1899 kéo sang tháng 1/1900 dương nên cũng được hỗ trợ. */
export const MIN_LUNAR_YEAR = MIN_YEAR - 1
/** Năm âm đầu tiên tính theo UTC+7. */
const UTC7_FROM_LUNAR_YEAR = 1968

const SYNODIC_MONTH = 29.530588853
const DR = Math.PI / 180

const fixKey = (tz: number, computedJdn: number) => `${tz}:${computedJdn}`

/** Ngày sóc theo bảng của Hồ Ngọc Đức khác ngày công thức tính ra: [múi giờ, ngày công thức, ngày bảng]. */
const NEW_MOON_FIXES: ReadonlyMap<string, number> = new Map(
  (
    [
      [8, '1906-04-24', '1906-04-23'],
      [8, '1914-11-18', '1914-11-17'],
      [8, '1916-02-04', '1916-02-03'],
      [8, '1920-11-11', '1920-11-10'],
      [8, '1925-01-24', '1925-01-25'],
      [7, '2054-05-08', '2054-05-07'],
      [7, '2072-12-10', '2072-12-09'],
      [7, '2077-11-16', '2077-11-15'],
    ] as const
  ).map(([tz, computed, official]) => [
    fixKey(tz, toJdn(parseIso(computed))),
    toJdn(parseIso(official)),
  ]),
)

/** Một tháng âm: số tháng, cờ nhuận, JDN ngày mùng 1 và số ngày (29/30). */
type Month = { month: number; leap: boolean; startJdn: number; days: number }
type Year = { year: number; months: readonly Month[] }

/** Tối đa ~200 phần tử (một năm âm mỗi phần tử) nên không cần giới hạn. */
const YEARS = new Map<number, Year>()

// ---------------------------------------------------------------- API

/** Đổi dương sang âm. Năm dương phải trong khoảng hỗ trợ. */
export function toLunar(solar: SolarDate): LunarDate {
  if (solar.year < MIN_YEAR || solar.year > MAX_YEAR) {
    throw new LunarError(`Chỉ hỗ trợ năm dương từ ${MIN_YEAR} đến ${MAX_YEAR}`)
  }
  const jdn = toJdn(solar)
  let year = yearOf(solar.year)
  if (jdn < year.months[0]!.startJdn) year = yearOf(solar.year - 1)
  for (let i = year.months.length - 1; i >= 0; i--) {
    const m = year.months[i]!
    if (jdn >= m.startJdn) {
      return { year: year.year, month: m.month, day: jdn - m.startJdn + 1, leap: m.leap }
    }
  }
  throw new LunarError(`Không tìm được tháng âm cho ${solar.year}-${solar.month}-${solar.day}`)
}

/** Đổi âm sang dương; ngày không tồn tại (tháng nhuận sai, ngày 30 của tháng thiếu...) thì ném lỗi. */
export function toSolar(lunar: LunarDate): SolarDate {
  requireDay(lunar.day)
  const m = monthOf(lunar.year, lunar.month, lunar.leap)
  if (lunar.day > m.days) {
    throw new LunarError(`Tháng âm ${lunar.month} năm ${lunar.year} chỉ có ${m.days} ngày`)
  }
  return fromJdn(m.startJdn + lunar.day - 1)
}

/** Ngày có tồn tại trong lịch âm và nằm trong khoảng hỗ trợ hay không. */
export function isValid(lunar: LunarDate): boolean {
  if (
    !Number.isInteger(lunar.year) ||
    !Number.isInteger(lunar.month) ||
    !Number.isInteger(lunar.day) ||
    lunar.year < MIN_LUNAR_YEAR ||
    lunar.year > MAX_YEAR ||
    lunar.month < 1 ||
    lunar.month > 12 ||
    lunar.day < 1 ||
    lunar.day > 30
  ) {
    return false
  }
  if (lunar.leap && leapMonth(lunar.year) !== lunar.month) return false
  return lunar.day <= daysInMonth(lunar.year, lunar.month, lunar.leap)
}

/** Số ngày của tháng âm (29 hoặc 30). */
export function daysInMonth(lunarYear: number, month: number, leap: boolean): number {
  return monthOf(lunarYear, month, leap).days
}

/** Tháng nhuận của năm âm, 0 nếu năm không nhuận. */
export function leapMonth(lunarYear: number): number {
  requireYear(lunarYear)
  return yearOf(lunarYear).months.find((m) => m.leap)?.month ?? 0
}

/** Ngày dương của mùng 1 tháng âm. */
export function firstDayOfMonth(lunarYear: number, month: number, leap: boolean): SolarDate {
  return fromJdn(monthOf(lunarYear, month, leap).startJdn)
}

/** Ngày dương của mùng 1 Tết năm âm. */
export function newYear(lunarYear: number): SolarDate {
  requireYear(lunarYear)
  return fromJdn(yearOf(lunarYear).months[0]!.startJdn)
}

// ---------------------------------------------------------------- Dựng năm âm

function timeZone(lunarYear: number): number {
  return lunarYear < UTC7_FROM_LUNAR_YEAR ? 8 : 7
}

function monthOf(lunarYear: number, month: number, leap: boolean): Month {
  requireYear(lunarYear)
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new LunarError('Tháng âm phải từ 1 đến 12')
  }
  const found = yearOf(lunarYear).months.find((m) => m.month === month && m.leap === leap)
  if (!found) throw new LunarError(`Năm âm ${lunarYear} không có tháng ${month} nhuận`)
  return found
}

function yearOf(lunarYear: number): Year {
  let year = YEARS.get(lunarYear)
  if (!year) {
    year = buildYear(lunarYear)
    YEARS.set(lunarYear, year)
  }
  return year
}

/** Mùng 1 của một tháng âm; `ofPreviousYear` = tháng 11, 12 (kể cả nhuận) thuộc năm âm trước. */
type MonthStart = { month: number; leap: boolean; jdn: number; ofPreviousYear: boolean }

/**
 * Năm âm Y gồm các tháng 1..10 của đoạn [tháng 11 năm Y-1, tháng 11 năm Y) và các tháng 11, 12 ở đầu đoạn kế tiếp.
 * Tháng cuối kéo tới ngay trước Tết năm Y+1 (tính theo múi giờ của năm Y+1), nên năm đổi múi giờ vẫn liền mạch.
 */
function buildYear(lunarYear: number): Year {
  const tz = timeZone(lunarYear)
  const starts = segment(lunarYear, tz).filter((m) => !m.ofPreviousYear)
  const following = segment(lunarYear + 1, tz)
  starts.push(...following.filter((m) => m.ofPreviousYear))
  // Cùng múi giờ thì Tết năm sau nằm ngay trong đoạn vừa tính, khỏi tính lại
  const end =
    timeZone(lunarYear + 1) === tz ? firstMonthOfYear(following) : newYearJdn(lunarYear + 1)
  const months = starts.map((m, i): Month => {
    const next = i + 1 < starts.length ? starts[i + 1]!.jdn : end
    return { month: m.month, leap: m.leap, startJdn: m.jdn, days: next - m.jdn }
  })
  return { year: lunarYear, months }
}

/** JDN mùng 1 Tết năm âm, tính theo múi giờ của chính năm đó. */
function newYearJdn(lunarYear: number): number {
  return firstMonthOfYear(segment(lunarYear, timeZone(lunarYear)))
}

function firstMonthOfYear(seg: readonly MonthStart[]): number {
  const first = seg.find((m) => !m.ofPreviousYear)
  if (!first) throw new LunarError('Đoạn tháng âm không có tháng Giêng')
  return first.jdn
}

/** Các tháng âm từ tháng 11 của năm dương `solarYear - 1` tới trước tháng 11 của năm dương `solarYear`. */
function segment(solarYear: number, tz: number): MonthStart[] {
  const a11 = lunarMonth11(solarYear - 1, tz)
  const b11 = lunarMonth11(solarYear, tz)
  const k = Math.floor((a11 - 2415021.076998695) / SYNODIC_MONTH + 0.5)
  const leapOffset = b11 - a11 > 365 ? leapMonthOffset(a11, tz) : -1
  const result: MonthStart[] = []
  for (let diff = 0; ; diff++) {
    const start = newMoonDay(k + diff, tz)
    if (start >= b11) break
    const number = leapOffset >= 0 && diff >= leapOffset ? diff + 10 : diff + 11
    const month = ((number - 1) % 12) + 1
    result.push({
      month,
      leap: diff === leapOffset,
      jdn: start,
      ofPreviousYear: month >= 11 && diff < 4,
    })
  }
  return result
}

// ---------------------------------------------------------------- Thiên văn (Hồ Ngọc Đức)

/** JDN của ngày bắt đầu tháng âm 11 (tháng chứa Đông chí) của năm dương. */
function lunarMonth11(solarYear: number, tz: number): number {
  const off = toJdn({ year: solarYear, month: 12, day: 31 }) - 2415021
  const k = Math.floor(off / SYNODIC_MONTH)
  let nm = newMoonDay(k, tz)
  if (sunLongitudeSector(nm, tz) >= 9) nm = newMoonDay(k - 1, tz)
  return nm
}

/** Vị trí (tính từ tháng 11) của tháng đầu tiên không chứa trung khí, tức tháng nhuận. */
function leapMonthOffset(a11: number, tz: number): number {
  const k = Math.floor((a11 - 2415021.076998695) / SYNODIC_MONTH + 0.5)
  let i = 1
  let arc = sunLongitudeSector(newMoonDay(k + i, tz), tz)
  let last: number
  do {
    last = arc
    i++
    arc = sunLongitudeSector(newMoonDay(k + i, tz), tz)
  } while (arc !== last && i < 14)
  return i - 1
}

/** JDN ngày chứa sóc thứ k (tính từ sóc 1/1/1900) theo giờ địa phương. */
function newMoonDay(k: number, tz: number): number {
  const computed = Math.floor(newMoon(k) + 0.5 + tz / 24)
  return NEW_MOON_FIXES.get(fixKey(tz, computed)) ?? computed
}

/** Cung hoàng đạo 30° (0..11) của Mặt Trời lúc 0h giờ địa phương; 0 là sau Xuân phân. */
function sunLongitudeSector(dayNumber: number, tz: number): number {
  return Math.floor((sunLongitude(dayNumber - 0.5 - tz / 24) / Math.PI) * 6)
}

/** Thời điểm sóc thứ k (ngày Julius, UTC). */
function newMoon(k: number): number {
  const t = k / 1236.85
  const t2 = t * t
  const t3 = t2 * t
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * DR)
  const m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3
  const mpr = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3
  const f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3
  let c1 = (0.1734 - 0.000393 * t) * Math.sin(m * DR) + 0.0021 * Math.sin(2 * DR * m)
  c1 = c1 - 0.4068 * Math.sin(mpr * DR) + 0.0161 * Math.sin(DR * 2 * mpr)
  c1 = c1 - 0.0004 * Math.sin(DR * 3 * mpr)
  c1 = c1 + 0.0104 * Math.sin(DR * 2 * f) - 0.0051 * Math.sin(DR * (m + mpr))
  c1 = c1 - 0.0074 * Math.sin(DR * (m - mpr)) + 0.0004 * Math.sin(DR * (2 * f + m))
  c1 = c1 - 0.0004 * Math.sin(DR * (2 * f - m)) - 0.0006 * Math.sin(DR * (2 * f + mpr))
  c1 = c1 + 0.001 * Math.sin(DR * (2 * f - mpr)) + 0.0005 * Math.sin(DR * (2 * mpr + m))
  const deltaT =
    t < -11
      ? 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3
      : -0.000278 + 0.000265 * t + 0.000262 * t2
  return jd1 + c1 - deltaT
}

/** Kinh độ Mặt Trời (radian, 0..2π) tại ngày Julius `jdn`. */
function sunLongitude(jdn: number): number {
  const t = (jdn - 2451545.0) / 36525
  const t2 = t * t
  const m = 357.5291 + 35999.0503 * t - 0.0001559 * t2 - 0.00000048 * t * t2
  const l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2
  let dl = (1.9146 - 0.004817 * t - 0.000014 * t2) * Math.sin(DR * m)
  dl = dl + (0.019993 - 0.000101 * t) * Math.sin(DR * 2 * m) + 0.00029 * Math.sin(DR * 3 * m)
  const l = (l0 + dl) * DR
  return l - Math.PI * 2 * Math.floor(l / (Math.PI * 2))
}

// ---------------------------------------------------------------- Tiện ích

function requireYear(lunarYear: number): void {
  if (!Number.isInteger(lunarYear) || lunarYear < MIN_LUNAR_YEAR || lunarYear > MAX_YEAR) {
    throw new LunarError(`Chỉ hỗ trợ năm âm từ ${MIN_LUNAR_YEAR} đến ${MAX_YEAR}`)
  }
}

function requireDay(day: number): void {
  if (!Number.isInteger(day) || day < 1 || day > 30) {
    throw new LunarError('Ngày âm phải từ 1 đến 30')
  }
}
