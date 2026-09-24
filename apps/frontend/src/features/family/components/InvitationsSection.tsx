import { Plus, Share2, Ticket, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/shared/Alert'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import type { Schemas } from '@/types/api'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/date'
import { useCreateInvitation, useInvitations, useRevokeInvitation } from '../hooks'
import { familyStrings as s } from '../strings'

type Invitation = Schemas['InvitationResponse']

const STATUS: Record<NonNullable<Invitation['status']>, { label: string; className: string }> = {
  ACTIVE: { label: s.invitations.active, className: 'bg-success-bg text-success' },
  EXPIRED: { label: s.invitations.expired, className: 'bg-warning-bg text-warning' },
  REVOKED: { label: s.invitations.revoked, className: 'bg-danger-bg text-danger' },
}

/** Chia sẻ link mời: Web Share API nếu có (điện thoại), không thì sao chép link vào bộ nhớ tạm. */
async function shareInvitation(invitation: Invitation, familyName: string): Promise<string | null> {
  const url = invitation.link ?? ''
  const data = {
    title: s.invitations.shareTitle,
    text: s.invitations.shareText(familyName, invitation.code ?? ''),
    url,
  }
  if (typeof navigator.share === 'function' && navigator.canShare?.(data) !== false) {
    try {
      await navigator.share(data)
      return null
    } catch (error) {
      // Người dùng tự đóng hộp thoại chia sẻ thì không phải lỗi
      if (error instanceof DOMException && error.name === 'AbortError') return null
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return s.invitations.copied
  } catch {
    return s.invitations.copyFailed
  }
}

// Chỉ Manager thấy mục này (backend cũng chặn phần còn lại bằng 403)
export function InvitationsSection({ familyName }: { familyName: string }) {
  const { data, isPending, isError, error } = useInvitations(true)
  const create = useCreateInvitation()
  const revoke = useRevokeInvitation()
  const [toRevoke, setToRevoke] = useState<Invitation | null>(null)
  const [shareNote, setShareNote] = useState<string | null>(null)

  async function handleShare(invitation: Invitation) {
    setShareNote(await shareInvitation(invitation, familyName))
  }

  return (
    <section
      aria-labelledby="invitations-title"
      className="rounded-card border border-border bg-surface p-4 shadow-card md:p-6"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 id="invitations-title" className="text-lg leading-tight font-semibold">
            {s.invitations.title}
          </h2>
          <p className="mt-1 text-text-muted">{s.invitations.description}</p>
        </div>
        <Button loading={create.isPending} onClick={() => create.mutate()} className="md:shrink-0">
          <Plus aria-hidden="true" />
          {s.invitations.create}
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {create.isError && <Alert>{create.error.message}</Alert>}
        {isError && <Alert>{error.message}</Alert>}
        {shareNote && (
          <div role="status" className="rounded-field bg-secondary px-4 py-3 text-secondary-fg">
            {shareNote}
          </div>
        )}
        {isPending && <p className="text-text-muted">Đang tải…</p>}
        {data?.length === 0 && <p className="text-text-muted">{s.invitations.empty}</p>}
        <ul className="flex flex-col gap-3">
          {data?.map((invitation) => {
            const status = STATUS[invitation.status ?? 'ACTIVE']
            const active = invitation.status === 'ACTIVE'
            return (
              <li
                key={invitation.id}
                className="flex flex-col gap-3 rounded-field bg-surface-muted p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Ticket className="size-5 shrink-0 text-text-muted" aria-hidden="true" />
                    <span className="font-mono text-lg font-semibold tracking-widest">
                      {invitation.code}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-3 py-0.5 text-sm font-medium whitespace-nowrap',
                        status.className,
                      )}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-muted">
                    {s.invitations.expires(formatDate(invitation.expiresAt))}
                  </p>
                </div>
                {active && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1 md:flex-none"
                      onClick={() => void handleShare(invitation)}
                    >
                      <Share2 aria-hidden="true" />
                      {s.invitations.share}
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1 text-danger md:flex-none"
                      onClick={() => {
                        revoke.reset()
                        setToRevoke(invitation)
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                      {s.invitations.revoke}
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <ConfirmDialog
        open={toRevoke !== null}
        danger
        title={s.invitations.revokeTitle}
        description={s.invitations.revokeDescription(toRevoke?.code ?? '')}
        confirmLabel={s.invitations.revoke}
        cancelLabel={s.dialog.cancel}
        loading={revoke.isPending}
        error={revoke.isError ? revoke.error.message : null}
        onCancel={() => setToRevoke(null)}
        onConfirm={() => {
          if (toRevoke?.id === undefined) return
          revoke.mutate(toRevoke.id, { onSuccess: () => setToRevoke(null) })
        }}
      />
    </section>
  )
}
