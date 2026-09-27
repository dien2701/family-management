// Quy tắc ngày cúng giỗ, sinh nhật và sự kiện lặp hằng năm (IDEA §7). Bản TS của
// `vn.giapha.calendar.service.AnniversaryRules`, phải giống hệt bản Java.
//
// Ngày âm trong năm âm Y được chọn theo thứ tự:
// 1. có ngày ghi đè (Manager đặt ngày cúng khác) thì lấy ngày ghi đè thay cho ngày gốc;
// 2. ngày thuộc tháng nhuận thì cúng vào tháng thường cùng số, kể cả khi năm Y cũng nhuận tháng đó;
// 3. năm Y tháng đó thiếu (29 ngày) mà ngày là 30 thì cúng ngày 29.
// Bước 2 và 3 áp dụng cả cho ngày ghi đè, để ngày cúng luôn tồn tại.
import { daysInMonth, toSolar } from './lunarCalendar'
import { isLeapYear } from './solarDate'
import { LunarError, type LunarDate, type LunarMonthDay, type SolarDate } from './types'

/** Ngày âm (luôn là tháng thường) để cúng giỗ, mừng sinh nhật âm hoặc làm sự kiện âm trong năm âm Y. */
export function lunarOccurrence(
  lunarYear: number,
  original: LunarMonthDay,
  override?: LunarMonthDay | null,
): LunarDate {
  const base = override ?? original
  requireMonthDay(base)
  const days = daysInMonth(lunarYear, base.month, false)
  return { year: lunarYear, month: base.month, day: Math.min(base.day, days), leap: false }
}

/** Như `lunarOccurrence` nhưng trả về ngày dương tương ứng. */
export function lunarOccurrenceSolar(
  lunarYear: number,
  original: LunarMonthDay,
  override?: LunarMonthDay | null,
): SolarDate {
  return toSolar(lunarOccurrence(lunarYear, original, override))
}

/** Sinh nhật hoặc sự kiện dương trong năm Y; 29/2 ở năm không nhuận dời sang 28/2. */
export function solarOccurrence(year: number, month: number, day: number): SolarDate {
  if (month === 2 && day === 29 && !isLeapYear(year)) return { year, month: 2, day: 28 }
  return { year, month, day }
}

function requireMonthDay(d: LunarMonthDay): void {
  if (d.month < 1 || d.month > 12 || d.day < 1 || d.day > 30) {
    throw new LunarError(`Ngày âm không hợp lệ: ${d.day}/${d.month}`)
  }
}
