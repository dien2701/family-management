import { Loader2, Plus, ScrollText, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Alert } from '@/components/shared/Alert'
import { EmptyState } from '@/components/shared/EmptyState'
import { FormField } from '@/components/shared/FormField'
import { ListGroup, ListRow } from '@/components/shared/ListRow'
import { SectionCard } from '@/components/shared/SectionCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { isAdmin } from '@/features/auth/routing'
import { useAuth } from '@/hooks/useAuth'
import type { PrayerSummary } from '@/types/api'
import { formatDate } from '@/utils/date'
import { toSearchName } from '@/utils/text'
import { PrayerFormDialog } from '../components/PrayerFormDialog'
import { usePrayers } from '../hooks'
import { prayerStrings } from '../strings'

const s = prayerStrings.list

type Sort = 'az' | 'oldest' | 'newest'
const SORTS: Sort[] = ['az', 'oldest', 'newest']

function sortPrayers(list: PrayerSummary[], sort: Sort): PrayerSummary[] {
  const copy = [...list]
  if (sort === 'az') return copy.sort((a, b) => a.title.localeCompare(b.title, 'vi'))
  const dir = sort === 'oldest' ? 1 : -1
  return copy.sort((a, b) => dir * (Date.parse(a.createdAt) - Date.parse(b.createdAt)) || a.id - b.id)
}

/** Danh sách bài khấn, công khai. Tìm và sắp xếp ngay trên máy, giữ trên URL (`q`, `sort`). */
export function PrayersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [creating, setCreating] = useState(false)
  const { data, isPending, isError } = usePrayers()

  const q = params.get('q') ?? ''
  const sortParam = params.get('sort')
  const sort: Sort = SORTS.includes(sortParam as Sort) ? (sortParam as Sort) : 'az'

  const setParam = (key: 'q' | 'sort', value: string) => {
    const next = new URLSearchParams(params)
    // Mặc định (A–Z, ô tìm trống) không ghi lên URL cho gọn
    if (value && !(key === 'sort' && value === 'az')) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const visible = useMemo(() => {
    const needle = toSearchName(q)
    const matched = (data ?? []).filter((p) => !needle || toSearchName(p.title).includes(needle))
    return sortPrayers(matched, sort)
  }, [data, q, sort])

  const admin = isAdmin(user)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold md:text-2xl">{s.title}</h1>
        {admin && (
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden="true" />
            {s.add}
          </Button>
        )}
      </div>

      <div className="grid gap-3 rounded-card border border-border bg-surface p-4 shadow-card md:grid-cols-[1fr_200px] md:p-6">
        <FormField label={s.searchLabel} hint={s.searchHint}>
          <Input
            type="search"
            value={q}
            autoComplete="off"
            onChange={(e) => setParam('q', e.target.value)}
          />
        </FormField>
        <FormField label={s.sortLabel}>
          <Select value={sort} onChange={(e) => setParam('sort', e.target.value)}>
            {SORTS.map((value) => (
              <option key={value} value={value}>
                {s.sort[value]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {isPending ? (
        <p role="status" className="flex items-center gap-2 text-text-muted">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          {s.loading}
        </p>
      ) : isError ? (
        <Alert>{s.loadFailed}</Alert>
      ) : data.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={s.emptyTitle}
          description={admin ? s.emptyAdmin : s.emptyGuest}
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={SearchX} title={s.noMatchTitle} description={s.noMatchHint} />
      ) : (
        <SectionCard title={s.count(visible.length)} icon={ScrollText}>
          <ListGroup>
            {visible.map((prayer) => (
              <ListRow
                key={prayer.id}
                to={`/bai-khan/${prayer.id}`}
                leading={
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-field bg-secondary text-secondary-fg">
                    <ScrollText className="size-5" aria-hidden="true" />
                  </span>
                }
                label={prayer.title}
                description={s.updated(formatDate(prayer.updatedAt))}
              />
            ))}
          </ListGroup>
        </SectionCard>
      )}

      <PrayerFormDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(saved) => void navigate(`/bai-khan/${saved.id}`)}
      />
    </div>
  )
}
