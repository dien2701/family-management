import type { CalendarDay } from '@/types/api'
import { cn } from '@/utils/cn'
import { toJdn, weekday, type SolarDate } from '@/utils/lunar'
import { EVENT_TYPE_META } from '../eventMeta'
import { shortSolar } from '../format'
import { mondayIndex, type CalendarMode } from '../monthNav'
import { calendarStrings } from '../strings'
import { dayLabel, dayNumbers, isSameDay } from './MonthGrid'

const s = calendarStrings.month

/** Chia các ngày của tháng thành từng tuần (thứ hai đến chủ nhật); tuần đầu và cuối có thể thiếu ngày. */
export function splitWeeks(days: CalendarDay[]): CalendarDay[][] {
  const weeks: CalendarDay[][] = []
  for (const day of days) {
    if (weeks.length === 0 || mondayIndex(weekday(day.solar)) === 0) weeks.push([])
    weeks[weeks.length - 1]!.push(day)
  }
  return weeks
}

type WeekListProps = {
  days: CalendarDay[]
  mode: CalendarMode
  today: SolarDate
  onSelect: (day: CalendarDay) => void
}

/** Lịch tháng dưới 768px: danh sách theo tuần, mỗi ngày một dòng kèm tên các sự kiện của ngày đó. */
export function WeekList({ days, mode, today, onSelect }: WeekListProps) {
  return (
    <div className="flex flex-col gap-4">
      {splitWeeks(days).map((week) => {
        const first = week[0]!
        const last = week[week.length - 1]!
        return (
          <section
            key={toJdn(first.solar)}
            aria-label={s.weekOf(shortSolar(first.solar), shortSolar(last.solar))}
            className="overflow-hidden rounded-card border border-border bg-surface shadow-card"
          >
            <h3 className="border-b border-border bg-surface-muted px-4 py-2 text-sm font-semibold text-text-muted">
              {s.weekOf(shortSolar(first.solar), shortSolar(last.solar))}
            </h3>
            <ul>
              {week.map((day) => {
                const { main, sub } = dayNumbers(day, mode)
                const isToday = isSameDay(day.solar, today)
                return (
                  <li key={toJdn(day.solar)} className="border-b border-border last:border-b-0">
                    <button
                      type="button"
                      aria-label={dayLabel(day)}
                      aria-current={isToday ? 'date' : undefined}
                      onClick={() => onSelect(day)}
                      className={cn(
                        'flex min-h-14 w-full cursor-pointer items-start gap-3 px-4 py-2 text-left transition-colors duration-200 ease-out hover:bg-secondary',
                        isToday && 'bg-secondary',
                      )}
                    >
                      <span className="flex w-12 shrink-0 flex-col items-center">
                        <span className="text-sm font-semibold text-text-muted">
                          {s.weekdays[mondayIndex(weekday(day.solar))]}
                        </span>
                        <span className="text-base leading-tight font-semibold tabular-nums">
                          {main}
                        </span>
                        <span className="text-[13px] text-text-muted tabular-nums">{sub}</span>
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1 self-center">
                        {day.occurrences.length === 0 ? (
                          <span className="text-sm text-text-muted">{s.noEvents}</span>
                        ) : (
                          day.occurrences.map((o) => {
                            const meta = EVENT_TYPE_META[o.type]
                            const Icon = meta.icon
                            return (
                              <span key={o.eventKey} className="flex items-start gap-2 text-base">
                                <Icon
                                  className={cn('mt-0.5 size-5 shrink-0', meta.text)}
                                  aria-hidden="true"
                                />
                                <span className="min-w-0 break-words">
                                  <span className="sr-only">{meta.label}: </span>
                                  {o.title}
                                </span>
                              </span>
                            )
                          })
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
