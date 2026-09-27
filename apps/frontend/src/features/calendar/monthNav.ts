// Điều hướng lịch tháng. Trạng thái là một ngày "tiêu điểm" nằm trong tháng đang xem, nên đổi giữa chế độ dương và
// âm vẫn giữ nguyên thời điểm đang xem. Hàm thuần.
import {
  MAX_YEAR,
  MIN_YEAR,
  daysInMonth,
  daysInSolarMonth,
  firstDayOfMonth,
  fromJdn,
  toJdn,
  toLunar,
  type SolarDate,
} from '@/utils/lunar'

export type CalendarMode = 'solar' | 'lunar'

export type MonthRef = { year: number; month: number; leap: boolean }

/** Tháng (dương hoặc âm) chứa ngày `focus`. */
export function monthOf(mode: CalendarMode, focus: SolarDate): MonthRef {
  if (mode === 'solar') return { year: focus.year, month: focus.month, leap: false }
  const l = toLunar(focus)
  return { year: l.year, month: l.month, leap: l.leap }
}

function bounds(mode: CalendarMode, ref: MonthRef): { first: SolarDate; length: number } {
  return mode === 'solar'
    ? {
        first: { year: ref.year, month: ref.month, day: 1 },
        length: daysInSolarMonth(ref.year, ref.month),
      }
    : {
        first: firstDayOfMonth(ref.year, ref.month, ref.leap),
        length: daysInMonth(ref.year, ref.month, ref.leap),
      }
}

/**
 * Ngày tiêu điểm của tháng liền trước (-1) hoặc liền sau (+1). Ra ngoài khoảng lịch hỗ trợ thì trả `null`
 * (nút tháng trước/sau bị tắt).
 */
export function shiftMonth(mode: CalendarMode, focus: SolarDate, step: 1 | -1): SolarDate | null {
  const { first, length } = bounds(mode, monthOf(mode, focus))
  const target = fromJdn(step === 1 ? toJdn(first) + length : toJdn(first) - 1)
  if (target.year < MIN_YEAR || target.year > MAX_YEAR) return null
  return target
}

/** Các thứ (0 = thứ hai … 6 = chủ nhật) để căn ngày mùng 1 vào đúng cột. */
export function mondayIndex(weekday: number): number {
  return (weekday + 6) % 7
}
