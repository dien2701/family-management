import type { CalendarOccurrence } from '@/types/api'
import { formatLunarDayMonth, formatSolar, formatSolarWithWeekday, type SolarDate } from '@/utils/lunar'
import { calendarStrings } from './strings'

const s = calendarStrings.occurrence

/** "Hôm nay", "Ngày mai", "còn 12 ngày", "đã qua 3 ngày". */
export function daysLabel(daysUntil: number): string {
  if (daysUntil === 0) return s.today
  if (daysUntil === 1) return s.tomorrow
  return daysUntil > 0 ? s.inDays(daysUntil) : s.agoDays(-daysUntil)
}

/** "giỗ lần thứ 5" hoặc "tròn 70 tuổi"; không có khi không biết năm. */
export function ordinalLabel(o: Pick<CalendarOccurrence, 'type' | 'ordinal'>): string | null {
  if (o.ordinal === null) return null
  if (o.type === 'MEMORIAL') return s.memorialNth(o.ordinal)
  if (o.type === 'BIRTHDAY') return s.birthdayAge(o.ordinal)
  return null
}

/** "Thứ ba, 17/02/2026 · 11/7 âm" */
export function occurrenceDateLine(o: Pick<CalendarOccurrence, 'solar' | 'lunar'>): string {
  return `${formatSolarWithWeekday(o.solar)} · ${formatLunarDayMonth(o.lunar)}`
}

/** "17/02" cho tiêu đề tuần. */
export const shortSolar = (d: SolarDate): string => formatSolar(d).slice(0, 5)
