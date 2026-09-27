import { Clock, Pencil, Search, UserCheck, UserX } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Alert } from '@/components/shared/Alert'
import { Badge } from '@/components/shared/Badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { MemberIdentity } from '@/components/shared/MemberIdentity'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useMe } from '@/hooks/useMe'
import { useMemberSearch } from '@/hooks/useMemberSearch'
import { ApiError } from '@/services/client'
import type { LinkRequest, MemberSummary } from '@/types/api'
import { formatDate } from '@/utils/date'
import { useCreateLinkRequest, useLinkedMember, useMyLinkRequests, useUnlinkMe } from '../hooks'
import { linkStrings as s } from '../strings'

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return (error.code && s.errors[error.code]) || error.message
  return s.genericError
}

const Card = ({ children, label }: { children: ReactNode; label: string }) => (
  <section
    aria-label={label}
    className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 shadow-card md:p-6"
  >
    {children}
  </section>
)

/** "Tôi là ai" (IDEA §6.3): xem trạng thái liên kết, gửi yêu cầu "Đây là tôi" hoặc hủy liên kết. */
export function MyIdentityPage() {
  const me = useMe()
  const mine = useMyLinkRequests()

  if (me.isPending || mine.isPending) {
    return (
      <div role="status" aria-label={s.page.loading} className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div aria-hidden="true" className="h-40 animate-pulse rounded-card border border-border bg-surface shadow-card" />
      </div>
    )
  }
  if (me.isError || mine.isError) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3">
        <Alert className="w-full">{s.page.loadFailed}</Alert>
        <Button
          variant="secondary"
          onClick={() => {
            void me.refetch()
            void mine.refetch()
          }}
        >
          {s.page.retry}
        </Button>
      </div>
    )
  }

  const memberId = me.data.memberId
  const pending = mine.data.find((r) => r.status === 'PENDING')
  // Yêu cầu gần nhất bị từ chối thì báo để User biết mà chọn lại
  const rejected = !pending && mine.data[0]?.status === 'REJECTED' ? mine.data[0] : undefined

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <p className="text-base text-text-muted">{s.page.intro}</p>
      {memberId != null ? (
        <LinkedCard memberId={memberId} />
      ) : pending ? (
        <PendingCard request={pending} />
      ) : (
        <>
          {rejected && (
            <Alert variant="info">
              {s.rejected(rejected.member.fullName, formatDate(rejected.decidedAt ?? rejected.createdAt))}
            </Alert>
          )}
          <SearchCard />
        </>
      )}
    </div>
  )
}

function LinkedCard({ memberId }: { memberId: number }) {
  const member = useLinkedMember(memberId)
  const unlink = useUnlinkMe()
  const [confirming, setConfirming] = useState(false)
  const name = member.data?.fullName ?? s.linked.notFoundName

  const close = () => {
    if (unlink.isPending) return
    unlink.reset()
    setConfirming(false)
  }

  return (
    <Card label={s.linked.title}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex size-10 items-center justify-center rounded-full bg-success-bg text-success">
          <UserCheck className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-lg leading-tight font-semibold">{s.linked.title}</h2>
        <Badge tone="success">{s.linked.you}</Badge>
      </div>
      <div>
        <p className="text-text-muted">{s.linked.description}</p>
        <p className="mt-1 text-xl font-bold [overflow-wrap:anywhere]">{name}</p>
      </div>
      <div className="flex flex-col gap-2 md:flex-row">
        <Button asChild>
          <Link to={`/thanh-vien/${memberId}`}>{s.linked.viewProfile}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to={`/thanh-vien/${memberId}/sua`}>
            <Pencil aria-hidden="true" />
            {s.linked.editProfile}
          </Link>
        </Button>
        <Button variant="secondary" className="md:ml-auto" onClick={() => setConfirming(true)}>
          <UserX aria-hidden="true" />
          {s.linked.unlink}
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        danger
        title={s.linked.unlinkTitle}
        description={s.linked.unlinkDescription(name)}
        confirmLabel={s.linked.unlinkConfirm}
        cancelLabel={s.linked.unlinkCancel}
        loading={unlink.isPending}
        error={unlink.isError ? errorMessage(unlink.error) : null}
        onConfirm={() => unlink.mutate(undefined, { onSuccess: () => setConfirming(false) })}
        onCancel={close}
      />
    </Card>
  )
}

function PendingCard({ request }: { request: LinkRequest }) {
  return (
    <Card label={s.pending.title}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex size-10 items-center justify-center rounded-full bg-warning-bg text-warning">
          <Clock className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-lg leading-tight font-semibold">{s.pending.title}</h2>
        <Badge tone="warning">{s.pending.badge}</Badge>
      </div>
      <div>
        <p>{s.pending.description(request.member.fullName)}</p>
        <p className="text-sm text-text-muted">{s.pending.sentAt(formatDate(request.createdAt))}</p>
      </div>
      <p className="text-text-muted">{s.pending.hint}</p>
    </Card>
  )
}

function SearchCard() {
  const [query, setQuery] = useState('')
  const [target, setTarget] = useState<MemberSummary | null>(null)
  const search = useMemberSearch(useDebouncedValue(query))
  const create = useCreateLinkRequest()
  const members = search.data?.items ?? []
  const total = search.data?.totalElements ?? 0

  const close = () => {
    if (create.isPending) return
    create.reset()
    setTarget(null)
  }

  return (
    <Card label={s.search.title}>
      <h2 className="text-lg leading-tight font-semibold">{s.search.title}</h2>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="identity-search" className="text-base font-medium">
          {s.search.label}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <Input
            id="identity-search"
            type="search"
            value={query}
            placeholder={s.search.placeholder}
            autoComplete="off"
            className="pl-10"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {search.isError ? (
        <div className="flex flex-col items-start gap-3">
          <Alert className="w-full">{s.search.loadFailed}</Alert>
          <Button variant="secondary" onClick={() => void search.refetch()}>
            {s.page.retry}
          </Button>
        </div>
      ) : search.isPending ? (
        <p role="status" className="py-6 text-center text-text-muted">
          {s.search.loading}
        </p>
      ) : members.length === 0 ? (
        <p className="py-6 text-center text-text-muted">{query.trim() ? s.search.noMatch : s.search.empty}</p>
      ) : (
        <>
          <ul aria-label={s.search.results} className="rounded-field border border-border">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex flex-col gap-3 border-b border-border p-3 last:border-b-0 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <MemberIdentity member={member} />
                </div>
                <Button
                  variant="secondary"
                  aria-label={s.search.thisIsMeFor(member.fullName)}
                  className="md:shrink-0"
                  onClick={() => setTarget(member)}
                >
                  {s.search.thisIsMe}
                </Button>
              </li>
            ))}
          </ul>
          {total > members.length && (
            <p className="text-sm text-text-muted tabular-nums">{s.search.truncated(members.length, total)}</p>
          )}
        </>
      )}

      <ConfirmDialog
        open={target !== null}
        title={s.confirm.title}
        description={target ? s.confirm.description(target.fullName) : ''}
        confirmLabel={s.confirm.confirm}
        cancelLabel={s.confirm.cancel}
        loading={create.isPending}
        error={create.isError ? errorMessage(create.error) : null}
        onConfirm={() => target && create.mutate(target.id, { onSuccess: () => setTarget(null) })}
        onCancel={close}
      />
    </Card>
  )
}
