import { Link2 } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/shared/Alert'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/services/client'
import type { LinkRequest } from '@/types/api'
import { LinkRequestList, type LinkRequestDecision } from '../components/LinkRequestList'
import { useLinkRequestAction, usePendingLinkRequests } from '../hooks'
import { accountErrorText, adminStrings as s } from '../strings'

type Pending = { request: LinkRequest; decision: LinkRequestDecision }

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return (error.code && accountErrorText[error.code]) || error.message
  return 'Có lỗi xảy ra, vui lòng thử lại.'
}

// Quản trị > Yêu cầu liên kết (IDEA §6.10): hàng đợi "Đây là tôi" của User, Admin duyệt hoặc từ chối.
export function LinkRequestsPage() {
  const requests = usePendingLinkRequests()
  const decide = useLinkRequestAction()
  const [pending, setPending] = useState<Pending | null>(null)

  const items = requests.data ?? []

  function open(request: LinkRequest, decision: LinkRequestDecision) {
    decide.reset()
    setPending({ request, decision })
  }

  function close() {
    if (decide.isPending) return
    decide.reset()
    setPending(null)
  }

  function confirm() {
    if (!pending) return
    decide.mutate(
      { id: pending.request.id, action: pending.decision },
      { onSuccess: () => setPending(null) },
    )
  }

  const t = s.linkRequests
  const approving = pending?.decision === 'approve'
  const account = pending?.request.accountFullName ?? ''
  const member = pending?.request.member.fullName ?? ''

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-text-muted">{t.description}</p>

      {requests.isPending ? (
        <div role="status" aria-label={t.loading} className="flex flex-col gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              aria-hidden="true"
              className="h-28 animate-pulse rounded-card border border-border bg-surface shadow-card"
            />
          ))}
        </div>
      ) : requests.isError ? (
        <div className="flex flex-col items-start gap-3">
          <Alert className="w-full">{t.loadFailed}</Alert>
          <Button variant="secondary" onClick={() => void requests.refetch()}>
            {t.retry}
          </Button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Link2} title={t.empty} description={t.emptyHint} />
      ) : (
        <LinkRequestList requests={items} onDecide={open} />
      )}

      <ConfirmDialog
        open={pending !== null}
        danger={!approving}
        title={approving ? t.approveTitle : t.rejectTitle}
        description={approving ? t.approveDescription(account, member) : t.rejectDescription(account, member)}
        confirmLabel={approving ? t.approveConfirm : t.rejectConfirm}
        cancelLabel={t.cancel}
        loading={decide.isPending}
        error={decide.isError ? errorMessage(decide.error) : null}
        onConfirm={confirm}
        onCancel={close}
      />
    </div>
  )
}
