import { CalendarCheck, CalendarX2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { CalendarDay } from '@/types/api'
import { cn } from '@/utils/cn'
import { todayInVietnam, toJdn, type SolarDate } from '@/utils/lunar'
import { useCalendarMonth } from '../hooks'
import { monthOf, shiftMonth, type CalendarMode } from '../monthNav'
import { calendarStrings } from '../strings'
import { DaySheet } from './DaySheet'
import { EventLegend } from './EventLegend'
import { MonthGrid } from './MonthGrid'
import { WeekList } from './WeekList'

const s = calendarStrings.month

type MonthTabProps = {
  isAdmin: boolean
  onEdit: (eventId: number) => void
  /** Thêm sự kiện vào ngày đã chọn; `mode` là lịch đang xem để điền sẵn đúng lịch. Không truyền thì chỉ xem. */
  onAdd?: (day: CalendarDay, mode: CalendarMode) => void
}

/** Tab "Lịch tháng": lưới từ 768px, danh sách theo tuần bên dưới; nút gạt "Xem theo âm" (IDEA §6.5). */
export function MonthTab({ isAdmin, onEdit, onAdd }: MonthTabProps) {
  const [today] = useState(todayInVietnam)
  const [mode, setMode] = useState<CalendarMode>('solar')
  // Một ngày nằm trong tháng đang xem; đổi dương/âm vẫn giữ đúng thời điểm
  const [focus, setFocus] = useState<SolarDate>(today)
  const [selected, setSelected] = useState<SolarDate | null>(null)
  const wide = useMediaQuery('(min-width: 768px)')

  const ref = useMemo(() => monthOf(mode, focus), [mode, focus])
  const query = useCalendarMonth(ref.year, ref.month, mode, ref.leap)
  const prev = useMemo(() => shiftMonth(mode, focus, -1), [mode, focus])
  const next = useMemo(() => shiftMonth(mode, focus, 1), [mode, focus])

  const title =
    mode === 'solar'
      ? `Tháng ${ref.month} năm ${ref.year}`
      : `Tháng ${ref.month}${ref.leap ? ' (nhuận)' : ''} âm lịch năm ${ref.year}`

  const days = query.data?.days
  const selectedDay =
    selected && days ? (days.find((d) => toJdn(d.solar) === toJdn(selected)) ?? null) : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="icon"
            aria-label={s.prev}
            disabled={!prev}
            onClick={() => prev && setFocus(prev)}
          >
            <ChevronLeft />
          </Button>
          <h2 aria-live="polite" className="min-w-0 px-2 text-lg leading-tight font-semibold">
            {title}
          </h2>
          <Button
            variant="secondary"
            size="icon"
            aria-label={s.next}
            disabled={!next}
            onClick={() => next && setFocus(next)}
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => setFocus(today)}>
            <CalendarCheck aria-hidden="true" />
            {s.today}
          </Button>
          <LunarSwitch checked={mode === 'lunar'} onChange={(v) => setMode(v ? 'lunar' : 'solar')} />
        </div>
      </div>

      <EventLegend />

      {!days && query.isPending ? (
        <p role="status" className="flex items-center gap-2 py-8 text-text-muted">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Đang tải…
        </p>
      ) : !days ? (
        <EmptyState
          icon={CalendarX2}
          title={s.loadFailed}
          description={s.outOfRange}
          action={<Button onClick={() => void query.refetch()}>Thử lại</Button>}
        />
      ) : (
        <div aria-busy={query.isFetching} className={cn(query.isPlaceholderData && 'opacity-60')}>
          {wide ? (
            <MonthGrid days={days} mode={mode} today={today} onSelect={(d) => setSelected(d.solar)} />
          ) : (
            <WeekList days={days} mode={mode} today={today} onSelect={(d) => setSelected(d.solar)} />
          )}
        </div>
      )}

      <DaySheet
        day={selectedDay}
        isAdmin={isAdmin}
        onClose={() => setSelected(null)}
        onEdit={(id) => {
          setSelected(null)
          onEdit(id)
        }}
        onAdd={
          onAdd &&
          ((d) => {
            setSelected(null)
            onAdd(d, mode)
          })
        }
      />
    </div>
  )
}

/** Nút gạt "Xem theo âm": nhãn luôn hiện, cả dòng là vùng bấm ≥44px. */
function LunarSwitch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-button px-2 text-base font-medium">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-6 w-11 shrink-0 rounded-full bg-deceased transition-colors duration-200 ease-out peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-surface after:transition-transform after:duration-200 after:ease-out peer-checked:after:translate-x-5"
      />
      {calendarStrings.month.lunarToggle}
    </label>
  )
}
