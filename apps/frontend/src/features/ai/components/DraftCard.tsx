import { ArrowRight, CalendarHeart } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/shared/Alert'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/ui/button'
import { isAdmin } from '@/features/auth/routing'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/client'
import type { AiDraft } from '@/types/api'
import { useDraftAction } from '../hooks'
import { aiStrings } from '../strings'

const S = aiStrings.draft

// Thẻ xem trước đề xuất sự kiện: có diff trước/sau, nút "Gửi đề xuất" (User) hoặc "Áp dụng" (Admin).
// AI không tự ghi dữ liệu; bấm nút xong thì thẻ chuyển sang trạng thái đã xử lý.
export function DraftCard({ draft: initial }: { draft: AiDraft }) {
  const { user } = useAuth()
  const admin = isAdmin(user)
  const [draft, setDraft] = useState(initial)
  const action = useDraftAction(admin ? 'apply' : 'submit')
  const done = draft.status !== 'PENDING'

  return (
    <section
      aria-label={S.title}
      className="mt-3 overflow-hidden rounded-card border border-border bg-surface shadow-card"
    >
      <header className="flex items-center gap-2 border-b border-border bg-surface-muted px-4 py-3">
        <CalendarHeart className="size-5 shrink-0 text-event-custom" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-text-muted">
            {S.title} · {S.action[draft.action]}
          </p>
          <h3 className="truncate text-base font-semibold">{draft.eventTitle}</h3>
        </div>
        {done && (
          <Badge tone="success">{draft.status === 'APPLIED' ? S.applied : S.submitted}</Badge>
        )}
      </header>

      <ul className="divide-y divide-border">
        {draft.changes.map((change) => (
          <li key={change.field} className="px-4 py-3">
            <p className="text-sm font-medium text-text-muted">{change.label}</p>
            <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <span className="rounded-field bg-danger-bg px-2 py-1 text-sm text-danger sm:min-w-0 sm:flex-1">
                <span className="sr-only">{S.before}: </span>
                {change.before ? <s>{change.before}</s> : S.empty}
              </span>
              <ArrowRight
                className="hidden size-4 shrink-0 text-text-muted sm:block"
                aria-hidden="true"
              />
              <span className="rounded-field bg-success-bg px-2 py-1 text-sm text-success sm:min-w-0 sm:flex-1">
                <span className="sr-only">{S.after}: </span>
                {change.after ?? S.empty}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <footer className="space-y-3 border-t border-border px-4 py-3">
        {action.error && (
          <Alert>
            {action.error instanceof ApiError ? action.error.message : aiStrings.genericError}
          </Alert>
        )}
        {!done && (
          <>
            <p className="text-sm text-text-muted">{S.note}</p>
            <Button
              className="w-full sm:w-auto"
              loading={action.isPending}
              onClick={() =>
                action.mutate(draft.id, { onSuccess: (updated) => setDraft(updated) })
              }
            >
              {admin ? S.apply : S.submit}
            </Button>
          </>
        )}
      </footer>
    </section>
  )
}
