import { CalendarX2, FilterX, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { EmptyState } from '@/components/shared/EmptyState'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { EventType } from '@/types/api'
import type { UpcomingQuery } from '../api'
import { EVENT_TYPES, EVENT_TYPE_META } from '../eventMeta'
import { useUpcoming } from '../hooks'
import { calendarStrings } from '../strings'
import { filterUpcoming, parseLunarParam } from '../upcomingFilter'
import { EventLegend } from './EventLegend'
import { OccurrenceRow } from './OccurrenceRow'

const s = calendarStrings.upcoming
const DAYS: UpcomingQuery['days'][] = [7, 15, 30, 90, 365]
const LUNAR_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const LUNAR_DAYS = Array.from({ length: 30 }, (_, i) => i + 1)

type UpcomingTabProps = {
  isAdmin: boolean
  onEdit: (eventId: number) => void
}

/**
 * Tab "Sắp tới": chọn khoảng thời gian, lọc theo loại, sắp xếp (IDEA §6.5); thêm tìm theo tên và lọc giỗ theo
 * ngày âm (DECISIONS #88). Từ khóa và ngày âm nằm trên URL (`?q=`, `?thangAm=`, `?ngayAm=`) để chia sẻ được.
 */
export function UpcomingTab({ isAdmin, onEdit }: UpcomingTabProps) {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const lunarMonth = parseLunarParam(params.get('thangAm'), 12)
  // Ngày âm chỉ có nghĩa khi đã chọn tháng
  const lunarDay = lunarMonth === null ? null : parseLunarParam(params.get('ngayAm'), 30)
  const lunarActive = lunarMonth !== null
  const searching = q.trim() !== '' || lunarActive

  const [days, setDays] = useState<UpcomingQuery['days']>(30)
  const [type, setType] = useState<EventType | ''>('')
  const [sort, setSort] = useState<UpcomingQuery['sort']>('asc')

  // Đang tìm thì xét cả năm và (với ngày âm) chỉ giỗ; bộ chọn khoảng và loại tạm khóa
  const query = useUpcoming({
    days: searching ? 365 : days,
    type: lunarActive ? 'MEMORIAL' : type || undefined,
    sort,
  })
  const items = useMemo(
    () => (query.data ? filterUpcoming(query.data, { q, lunarMonth, lunarDay }) : []),
    [query.data, q, lunarMonth, lunarDay],
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
    update({ q: null, thangAm: null, ngayAm: null })
  }

  return (
    <div className="flex flex-col gap-4">
      <FormField label={s.search} hint={s.searchHint}>
        <Input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          maxLength={100}
          placeholder={s.searchPlaceholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormField label={s.range}>
          <Select
            value={searching ? 365 : days}
            disabled={searching}
            onChange={(e) => setDays(Number(e.target.value) as UpcomingQuery['days'])}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {s.days[d]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={s.type}>
          <Select
            value={lunarActive ? 'MEMORIAL' : type}
            disabled={lunarActive}
            onChange={(e) => setType(e.target.value as EventType | '')}
          >
            <option value="">{s.allTypes}</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_META[t].label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={s.sort}>
          <Select value={sort} onChange={(e) => setSort(e.target.value as UpcomingQuery['sort'])}>
            <option value="asc">{s.sortAsc}</option>
            <option value="desc">{s.sortDesc}</option>
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-3">
        <FormField label={s.lunarMonth} hint={s.lunarHint}>
          <Select
            value={lunarMonth ?? ''}
            onChange={(e) =>
              update({ thangAm: e.target.value || null, ...(e.target.value ? {} : { ngayAm: null }) })
            }
          >
            <option value="">{s.lunarAllMonths}</option>
            {LUNAR_MONTHS.map((m) => (
              <option key={m} value={m}>
                {s.lunarMonthOption(m)}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={s.lunarDay}>
          <Select
            value={lunarDay ?? ''}
            disabled={!lunarActive}
            onChange={(e) => update({ ngayAm: e.target.value || null })}
          >
            <option value="">{s.lunarAllDays}</option>
            {LUNAR_DAYS.map((d) => (
              <option key={d} value={d}>
                {s.lunarDayOption(d)}
              </option>
            ))}
          </Select>
        </FormField>
        {searching && (
          // Nhãn rỗng giữ hàng với hai ô bên cạnh để nút thẳng hàng với ô chọn
          <div className="flex flex-col gap-1.5">
            <span aria-hidden="true" className="hidden text-base font-medium sm:block">
              &nbsp;
            </span>
            <Button variant="secondary" onClick={clearFilters}>
              <FilterX aria-hidden="true" />
              {s.clearFilters}
            </Button>
          </div>
        )}
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
