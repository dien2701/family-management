import type { CalendarDay } from '@/types/api'
import { cn } from '@/utils/cn'
import {
  formatLunarDayMonth,
  formatSolarWithWeekday,
  toJdn,
  weekday,
  type SolarDate,
} from '@/utils/lunar'
import { EVENT_TYPES, EVENT_TYPE_META } from '../eventMeta'
import { mondayIndex, type CalendarMode } from '../monthNav'
import { calendarStrings } from '../strings'

/** Số lớn và số nhỏ của một ô ngày: chế độ dương thì số dương lớn, chế độ âm thì ngược lại. Mùng 1 kèm tháng. */
export function dayNumbers(day: CalendarDay, mode: CalendarMode): { main: string; sub: string } {
  const { solar, lunar } = day
  const lunarText = lunar.day === 1 ? `${lunar.day}/${lunar.month}${lunar.leap ? 'n' : ''}` : `${lunar.day}`
  const solarText = solar.day === 1 ? `${solar.day}/${solar.month}` : `${solar.day}`
  return mode === 'solar'
    ? { main: String(solar.day), sub: lunarText }
    : { main: String(lunar.day), sub: solarText }
}

/** Nhãn đọc được cho trình đọc màn hình: ngày dương, ngày âm và các loại sự kiện. */
export function dayLabel(day: CalendarDay): string {
  const base = `${formatSolarWithWeekday(day.solar)}, ${formatLunarDayMonth(day.lunar)}`
  if (day.occurrences.length === 0) return base
  const kinds = EVENT_TYPES.filter((t) => day.occurrences.some((o) => o.type === t)).map(
    (t) => EVENT_TYPE_META[t].label,
  )
  return `${base}, ${day.occurrences.length} sự kiện: ${kinds.join(', ')}`
}

export const isSameDay = (a: SolarDate, b: SolarDate) => toJdn(a) === toJdn(b)

type MonthGridProps = {
  days: CalendarDay[]
  mode: CalendarMode
  today: SolarDate
  onSelect: (day: CalendarDay) => void
}

/** Lưới tháng (từ 768px): 7 cột bắt đầu từ thứ hai; mỗi ô có số lớn, số nhỏ và chấm màu theo loại (DESIGN §6). */
export function MonthGrid({ days, mode, today, onSelect }: MonthGridProps) {
  const blanks = days.length > 0 ? mondayIndex(weekday(days[0]!.solar)) : 0

  return (
    <div className="rounded-card border border-border bg-surface p-3 shadow-card md:p-4">
      <div className="grid grid-cols-7 gap-1">
        {calendarStrings.month.weekdays.map((w, i) => (
          <div
            key={w}
            className={cn(
              'py-2 text-center text-sm font-semibold text-text-muted',
              i === 6 && 'text-danger',
            )}
          >
            {w}
          </div>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <div key={`blank-${i}`} aria-hidden="true" />
        ))}
        {days.map((day) => {
          const { main, sub } = dayNumbers(day, mode)
          const isToday = isSameDay(day.solar, today)
          const types = EVENT_TYPES.filter((t) => day.occurrences.some((o) => o.type === t))
          return (
            <button
              key={toJdn(day.solar)}
              type="button"
              aria-label={dayLabel(day)}
              aria-current={isToday ? 'date' : undefined}
              onClick={() => onSelect(day)}
              className={cn(
                'flex min-h-20 cursor-pointer flex-col items-start justify-between rounded-field border p-2 text-left transition-colors duration-200 ease-out hover:bg-secondary',
                isToday ? 'border-accent bg-secondary' : 'border-border bg-surface-muted',
              )}
            >
              <span className="flex w-full items-baseline justify-between gap-1">
                <span className="text-base font-semibold tabular-nums">{main}</span>
                <span className="text-[13px] text-text-muted tabular-nums">{sub}</span>
              </span>
              <span className="flex min-h-2.5 items-center gap-1" aria-hidden="true">
                {types.map((t) => (
                  <span key={t} className={cn('size-2.5 rounded-full', EVENT_TYPE_META[t].dot)} />
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
