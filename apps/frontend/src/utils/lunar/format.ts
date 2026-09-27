import { formatSolar, weekday } from './solarDate'
import type { LunarDate, LunarMonthDay, SolarDate } from './types'

const WEEKDAYS = [
  'Chủ nhật',
  'Thứ hai',
  'Thứ ba',
  'Thứ tư',
  'Thứ năm',
  'Thứ sáu',
  'Thứ bảy',
] as const

export const weekdayName = (date: SolarDate): string => WEEKDAYS[weekday(date)]!

/** "Thứ ba, 17/02/2026" */
export const formatSolarWithWeekday = (date: SolarDate): string =>
  `${weekdayName(date)}, ${formatSolar(date)}`

/** "12/3 âm" hoặc "12/3 (nhuận) âm" (DESIGN §7). */
export const formatLunarDayMonth = ({ day, month, leap }: LunarMonthDay): string =>
  `${day}/${month}${leap ? ' (nhuận)' : ''} âm`

/** "12/3 âm lịch năm 2026" */
export const formatLunar = (d: LunarDate): string => `${formatLunarDayMonth(d)} lịch năm ${d.year}`
