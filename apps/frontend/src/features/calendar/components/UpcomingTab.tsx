import { CalendarX2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@/components/shared/EmptyState'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { EventType } from '@/types/api'
import type { UpcomingQuery } from '../api'
import { EVENT_TYPES, EVENT_TYPE_META } from '../eventMeta'
import { useUpcoming } from '../hooks'
import { calendarStrings } from '../strings'
import { EventLegend } from './EventLegend'
import { OccurrenceRow } from './OccurrenceRow'

const s = calendarStrings.upcoming
const DAYS: UpcomingQuery['days'][] = [7, 15, 30, 90, 365]

type UpcomingTabProps = {
  isAdmin: boolean
  onEdit: (eventId: number) => void
}

/** Tab "Sắp tới": chọn khoảng thời gian, lọc theo loại, sắp xếp (IDEA §6.5). */
export function UpcomingTab({ isAdmin, onEdit }: UpcomingTabProps) {
  const [days, setDays] = useState<UpcomingQuery['days']>(30)
  const [type, setType] = useState<EventType | ''>('')
  const [sort, setSort] = useState<UpcomingQuery['sort']>('asc')
  const query = useUpcoming({ days, type: type || undefined, sort })

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormField label={s.range}>
          <Select
            value={days}
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
          <Select value={type} onChange={(e) => setType(e.target.value as EventType | '')}>
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
      ) : query.data.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title={s.empty}
          description={isAdmin ? s.emptyAdmin : s.emptyHint}
        />
      ) : (
        <ul
          aria-busy={query.isFetching}
          className="flex flex-col gap-2 data-[busy=true]:opacity-60"
          data-busy={query.isFetching && query.isPlaceholderData}
        >
          {query.data.map((o) => (
            <OccurrenceRow key={o.eventKey} occurrence={o} onEdit={isAdmin ? onEdit : undefined} />
          ))}
        </ul>
      )}
    </div>
  )
}
