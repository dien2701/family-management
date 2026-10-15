import { BookOpen, Loader2, Pencil, ScrollText, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Alert } from '@/components/shared/Alert'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isAdmin, isApproved } from '@/features/auth/routing'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/client'
import type { Prayer } from '@/types/api'
import { PrayerFormDialog } from '../components/PrayerFormDialog'
import { ReaderMode } from '../components/ReaderMode'
import { useDeletePrayer, usePrayer, usePrayerFill, useSavePrayerFill } from '../hooks'
import { readLocalFill, saveLocalFill, type FillValues } from '../localFill'
import { MAX_VALUE, extractSlots, fillContent } from '../slots'
import { prayerStrings } from '../strings'

const s = prayerStrings.detail

/** Chi tiết bài khấn, công khai: điền thông tin cá nhân, xem bài đã thay giá trị và đọc chữ to. */
export function PrayerDetailPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const id = Number(useParams().id)
  const prayer = usePrayer(id)
  const approved = isApproved(user)
  const fill = usePrayerFill(id, approved)
  const remove = useDeletePrayer()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  if (prayer.isPending && prayer.fetchStatus !== 'idle') {
    return (
      <p role="status" className="flex items-center justify-center gap-2 py-12 text-text-muted">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        {prayerStrings.list.loading}
      </p>
    )
  }

  if (!prayer.data) {
    const notFound =
      !(Number.isInteger(id) && id > 0) ||
      (prayer.error instanceof ApiError && prayer.error.status === 404)
    return notFound ? (
      <EmptyState
        icon={ScrollText}
        title={s.notFoundTitle}
        description={s.notFoundHint}
        action={
          <Button asChild>
            <Link to="/bai-khan">{s.back}</Link>
          </Button>
        }
      />
    ) : (
      <Alert>{s.loadFailed}</Alert>
    )
  }

  const data = prayer.data
  const confirmDelete = async () => {
    setDeleteError(null)
    try {
      await remove.mutateAsync(data.id)
      void navigate('/bai-khan', { replace: true })
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : s.deleteFailed)
    }
  }

  // Tài khoản đã duyệt đọc từ server, còn lại từ máy này. Chờ server xong mới dựng khối điền để lấy đúng giá trị đầu.
  const waitingFill = approved && fill.isPending
  const fillFailed = approved && fill.isError

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="min-w-0 text-xl leading-tight font-bold md:text-2xl">{data.title}</h1>
        {isAdmin(user) && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil aria-hidden="true" />
              {s.edit}
            </Button>
            <Button variant="ghost" className="text-danger" onClick={() => setConfirming(true)}>
              <Trash2 aria-hidden="true" />
              {s.delete}
            </Button>
          </div>
        )}
      </div>

      {waitingFill ? (
        <p role="status" className="flex items-center gap-2 text-text-muted">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          {prayerStrings.list.loading}
        </p>
      ) : (
        <FillPanel
          key={data.id}
          prayer={data}
          initial={approved ? (fill.data?.values ?? {}) : readLocalFill(data.id)}
          approved={approved}
          loggedIn={user !== null}
          fillFailed={fillFailed}
        />
      )}

      <PrayerFormDialog open={editing} prayer={data} onClose={() => setEditing(false)} />
      <ConfirmDialog
        open={confirming}
        title={s.deleteConfirmTitle}
        description={s.deleteConfirmBody(data.title)}
        confirmLabel={s.deleteConfirm}
        cancelLabel={s.cancel}
        danger
        loading={remove.isPending}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          setConfirming(false)
          setDeleteError(null)
        }}
      />
    </div>
  )
}

type FillPanelProps = {
  prayer: Prayer
  initial: FillValues
  approved: boolean
  loggedIn: boolean
  fillFailed: boolean
}

function FillPanel({ prayer, initial, approved, loggedIn, fillFailed }: FillPanelProps) {
  const save = useSavePrayerFill()
  const [draft, setDraft] = useState<FillValues>(initial)
  const [reading, setReading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'failed'>('idle')

  const slots = useMemo(() => extractSlots(prayer.content), [prayer.content])
  const text = useMemo(() => fillContent(prayer.content, draft), [prayer.content, draft])

  const change = (name: string, value: string) => {
    setDraft((d) => ({ ...d, [name]: value }))
    setStatus('idle')
  }

  const submit = async () => {
    // Ô để trống thì không lưu; ô của bài cũ (đã bị Admin đổi tên) vẫn giữ để không mất thông tin
    const values = Object.fromEntries(
      Object.entries(draft)
        .map(([k, v]) => [k, v.trim()] as const)
        .filter(([, v]) => v !== ''),
    )
    if (!approved) {
      saveLocalFill(prayer.id, values)
      setStatus('saved')
      return
    }
    try {
      await save.mutateAsync({ id: prayer.id, values })
      setStatus('saved')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <>
      <section
        aria-labelledby="prayer-info"
        className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 shadow-card md:p-6"
      >
        <h2 id="prayer-info" className="text-lg leading-tight font-semibold">
          {s.yourInfo}
        </h2>

        {slots.length === 0 ? (
          <p className="text-text-muted">{s.noSlots}</p>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              {slots.map((name) => (
                <FormField key={name} label={name}>
                  <Input
                    value={draft[name] ?? ''}
                    maxLength={MAX_VALUE}
                    autoComplete="off"
                    onChange={(e) => change(name, e.target.value)}
                  />
                </FormField>
              ))}
            </div>
            <p className="text-sm text-text-muted">
              {s.slotHint} {!approved && s.storedOnDevice}{' '}
              {!loggedIn && s.loginToSync}
            </p>
            {fillFailed && <Alert>{s.fillLoadFailed}</Alert>}
            {status === 'saved' && <Alert variant="success">{s.saved}</Alert>}
            {status === 'failed' && <Alert>{s.saveFailed}</Alert>}
            <div>
              <Button type="submit" loading={save.isPending} disabled={fillFailed}>
                {s.save}
              </Button>
            </div>
          </form>
        )}
      </section>

      <section
        aria-labelledby="prayer-content"
        className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 shadow-card md:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="prayer-content" className="text-lg leading-tight font-semibold">
            {s.content}
          </h2>
          <Button variant="secondary" onClick={() => setReading(true)}>
            <BookOpen aria-hidden="true" />
            {s.readerOpen}
          </Button>
        </div>
        <p className="text-lg leading-relaxed whitespace-pre-wrap">{text}</p>
      </section>

      {reading && (
        <ReaderMode title={prayer.title} text={text} onClose={() => setReading(false)} />
      )}
    </>
  )
}
