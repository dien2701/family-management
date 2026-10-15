import { ArrowUpDown, CalendarX2, Loader2, Search, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterChip } from '@/components/shared/FilterChip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { EventType } from '@/types/api'
import type { UpcomingQuery } from '../api'
import { EVENT_TYPES, EVENT_TYPE_META } from '../eventMeta'
import { useUpcoming } from '../hooks'
import { calendarStrings } from '../strings'
import { filterUpcoming } from '../upcomingFilter'
import { EventLegend } from './EventLegend'
import { OccurrenceRow } from './OccurrenceRow'

const s = calendarStrings.upcoming
const DAYS: UpcomingQuery['days'][] = [7, 15, 30, 90, 365]

type UpcomingTabProps = {
  isAdmin: boolean
  onEdit: (eventId: number) => void
}

/**
 * Tab "Sắp tới": chọn khoảng thời gian, lọc theo loại, sắp xếp (IDEA §6.5); thêm tìm theo tên (DECISIONS #88).
 * Từ khóa nằm trên URL (`?q=`) để chia sẻ được.
 */
export function UpcomingTab({ isAdmin, onEdit }: UpcomingTabProps) {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const searching = q.trim() !== ''

  const [days, setDays] = useState<UpcomingQuery['days']>(30)
  const [type, setType] = useState<EventType | ''>('')
  const [sort, setSort] = useState<UpcomingQuery['sort']>('asc')

  // Đang tìm thì xét cả năm; bộ chọn khoảng tạm khóa
  const query = useUpcoming({
    days: searching ? 365 : days,
    type: type || undefined,
    sort,
  })
  const rangeValue = searching ? 365 : days
  const typeValue: EventType | 'all' = type || 'all'
  const items = useMemo(
    () => (query.data ? filterUpcoming(query.data, { q, lunarMonth: null, lunarDay: null }) : []),
    [query.data, q],
  )

  const update = useCallback(
    (changes: Record<string, string | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value)
            else next.delete(key)
          }
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  // Ô tìm giữ state cục bộ: gắn thẳng vào URL thì mỗi lần router cập nhật sẽ làm hỏng bộ gõ tiếng Việt (Telex/VNI)
  const [text, setText] = useState(q)
  const lastPushed = useRef(q)
  useEffect(() => {
    // Đồng bộ khi q đổi từ bên ngoài (nút Back, xóa lọc...)
    if (q !== lastPushed.current) {
      lastPushed.current = q
      setText(q)
    }
  }, [q])
  useEffect(() => {
    if (text === lastPushed.current) return
    const timer = setTimeout(() => {
      lastPushed.current = text
      update({ q: text.trim() ? text : null })
    }, 300)
    return () => clearTimeout(timer)
  }, [text, update])

  const clearFilters = () => {
    lastPushed.current = ''
    setText('')
    update({ q: null })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Cùng kiểu trang Thành viên: điện thoại lưới 2 cột, từ md một hàng với chip rộng cố định */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 items-center gap-2 md:flex">
          <div className="relative col-span-2 min-w-0 md:min-w-40 md:flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-text-muted" />
            <Input
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              maxLength={100}
              aria-label={s.searchPlaceholder}
              placeholder={s.searchPlaceholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="pl-10"
            />
          </div>

          <FilterChip
            widthClass="md:w-40"
            label={s.range}
            face={s.days[rangeValue]}
            active={rangeValue !== 30}
            disabled={searching}
            value={String(rangeValue)}
            options={DAYS.map((d) => ({ value: String(d), text: s.days[d] }))}
            onChange={(v) => setDays(Number(v) as UpcomingQuery['days'])}
          />

          <FilterChip
            widthClass="md:w-44"
            label={s.type}
            face={typeValue === 'all' ? s.type : EVENT_TYPE_META[typeValue].label}
            active={typeValue !== 'all'}
            value={typeValue}
            options={[
              { value: 'all', text: s.allTypes },
              ...EVENT_TYPES.map((t) => ({ value: t, text: EVENT_TYPE_META[t].label })),
            ]}
            onChange={(v) => setType(v === 'all' ? '' : (v as EventType))}
          />

          <FilterChip
            icon={ArrowUpDown}
            widthClass="md:w-48"
            label={s.sort}
            face={sort === 'asc' ? s.sortAsc : s.sortDesc}
            active={sort === 'desc'}
            value={sort}
            options={[
              { value: 'asc', text: s.sortAsc },
              { value: 'desc', text: s.sortDesc },
            ]}
            onChange={(v) => setSort(v as UpcomingQuery['sort'])}
          />

          {/* Luôn giữ chỗ, mờ khi chưa tìm; từ md chỉ còn biểu tượng */}
          <Button
            variant="ghost"
            disabled={!searching}
            aria-label={s.clearFilters}
            title={s.clearFilters}
            className="col-span-2 md:w-11 md:shrink-0 md:px-0"
            onClick={clearFilters}
          >
            <X aria-hidden />
            <span className="md:sr-only">{s.clearFilters}</span>
          </Button>
        </div>
      </div>

      <EventLegend />

      {query.isPending ? (
        <p role="status" className="flex items-center gap-2 py-8 text-text-muted">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Đang tải…
        </p>
      ) : query.isError ? (
        <EmptyState
          icon={CalendarX2}
          title={s.loadFailed}
          action={<Button onClick={() => void query.refetch()}>{s.retry}</Button>}
        />
      ) : items.length === 0 ? (
        searching ? (
          <EmptyState
            icon={CalendarX2}
            title={s.noMatch}
            description={s.noMatchHint}
            action={<Button onClick={clearFilters}>{s.clearFilters}</Button>}
          />
        ) : (
          <EmptyState
            icon={CalendarX2}
            title={s.empty}
            description={isAdmin ? s.emptyAdmin : s.emptyHint}
          />
        )
      ) : (
        <>
          {searching && (
            <p role="status" className="text-sm text-text-muted">
              {s.found(items.length)}
            </p>
          )}
          <ul
            aria-busy={query.isFetching}
            className="flex flex-col gap-2 data-[busy=true]:opacity-60"
            data-busy={query.isFetching && query.isPlaceholderData}
          >
            {items.map((o) => (
              <OccurrenceRow key={o.eventKey} occurrence={o} onEdit={onEdit} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
