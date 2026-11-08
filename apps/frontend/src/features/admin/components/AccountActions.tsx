import { Button } from '@/components/ui/button'
import type { AccountAdmin } from '@/types/api'
import { actionsFor, canDelete, linkActionFor } from '../accountRules'
import type { AccountAction, LinkAction } from '../api'
import { accountActionText, adminStrings } from '../strings'

type AccountActionsProps = {
  account: AccountAdmin
  selfId: number | undefined
  onAction: (account: AccountAdmin, action: AccountAction) => void
  onLinkAction: (account: AccountAdmin, action: LinkAction) => void
}

// Nút thường lên trên, nút nguy hiểm (Từ chối, Khóa, Xóa) xuống cuối để khó bấm nhầm
const ORDER: AccountAction[] = ['restore', 'approve', 'unlock', 'grant-admin', 'revoke-admin', 'reject', 'lock', 'delete']
const DANGER = new Set<AccountAction>(['reject', 'lock', 'delete'])

/** Các thao tác trong hộp chi tiết tài khoản: xếp dọc, rộng hết hộp; bấm chỉ mở hộp xác nhận. */
export function AccountActions({ account, selfId, onAction, onLinkAction }: AccountActionsProps) {
  const actions = [...actionsFor(account, selfId), ...(canDelete(account, selfId) ? (['delete'] as const) : [])].sort(
    (a, b) => ORDER.indexOf(a) - ORDER.indexOf(b),
  )
  const linkAction = linkActionFor(account, selfId)
  if (actions.length === 0 && linkAction === null) return null
  const name = account.fullName ?? ''
  const safe = actions.filter((a) => !DANGER.has(a))
  const danger = actions.filter((a) => DANGER.has(a))

  const actionButton = (action: AccountAction) => (
    <Button
      key={action}
      variant={action === 'approve' || action === 'restore' ? 'primary' : DANGER.has(action) ? 'danger' : 'secondary'}
      aria-label={`${accountActionText[action].label} ${name}`.trim()}
      onClick={() => onAction(account, action)}
    >
      {accountActionText[action].label}
    </Button>
  )

  return (
    <div className="flex flex-col gap-2">
      {safe.map(actionButton)}
      {linkAction && (
        <Button
          variant="outline"
          aria-label={
            linkAction === 'link' ? adminStrings.link.assignFor(name) : adminStrings.link.unassignFor(name)
          }
          onClick={() => onLinkAction(account, linkAction)}
        >
          {linkAction === 'link' ? adminStrings.link.assign : adminStrings.link.unassign}
        </Button>
      )}
      {danger.map(actionButton)}
    </div>
  )
}
