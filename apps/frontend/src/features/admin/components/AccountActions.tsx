import { Link2, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AccountAdmin } from '@/types/api'
import { actionsFor, linkActionFor } from '../accountRules'
import type { AccountAction, LinkAction } from '../api'
import { accountActionText, adminStrings } from '../strings'

type AccountActionsProps = {
  account: AccountAdmin
  selfId: number | undefined
  onAction: (account: AccountAdmin, action: AccountAction) => void
  onLinkAction: (account: AccountAdmin, action: LinkAction) => void
}

const VARIANT = {
  approve: 'primary',
  reject: 'danger',
  lock: 'danger',
  unlock: 'secondary',
  'grant-admin': 'secondary',
  'revoke-admin': 'secondary',
} as const satisfies Record<AccountAction, 'primary' | 'danger' | 'secondary'>

// Mỗi nút có aria-label kèm tên để trình đọc màn hình phân biệt các dòng; bấm chỉ mở hộp xác nhận
export function AccountActions({ account, selfId, onAction, onLinkAction }: AccountActionsProps) {
  const actions = actionsFor(account, selfId)
  const linkAction = linkActionFor(account, selfId)
  if (actions.length === 0 && linkAction === null) return null
  const name = account.fullName ?? ''
  return (
    <div className="flex flex-wrap gap-2 md:justify-end">
      {actions.map((action) => (
        <Button
          key={action}
          variant={VARIANT[action]}
          aria-label={`${accountActionText[action].label} ${name}`.trim()}
          onClick={() => onAction(account, action)}
        >
          {accountActionText[action].label}
        </Button>
      ))}
      {linkAction === 'link' && (
        <Button
          variant="secondary"
          aria-label={adminStrings.link.assignFor(name)}
          onClick={() => onLinkAction(account, 'link')}
        >
          <Link2 aria-hidden="true" />
          {adminStrings.link.assign}
        </Button>
      )}
      {linkAction === 'unlink' && (
        <Button
          variant="secondary"
          aria-label={adminStrings.link.unassignFor(name)}
          onClick={() => onLinkAction(account, 'unlink')}
        >
          <Unlink aria-hidden="true" />
          {adminStrings.link.unassign}
        </Button>
      )}
    </div>
  )
}
