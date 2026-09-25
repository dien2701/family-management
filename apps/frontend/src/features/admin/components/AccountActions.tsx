import { Button } from '@/components/ui/button'
import type { AccountAdmin } from '@/types/api'
import { actionsFor } from '../accountRules'
import type { AccountAction } from '../api'
import { accountActionText } from '../strings'

type AccountActionsProps = {
  account: AccountAdmin
  selfId: number | undefined
  onAction: (account: AccountAdmin, action: AccountAction) => void
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
export function AccountActions({ account, selfId, onAction }: AccountActionsProps) {
  const actions = actionsFor(account, selfId)
  if (actions.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 md:justify-end">
      {actions.map((action) => (
        <Button
          key={action}
          variant={VARIANT[action]}
          aria-label={`${accountActionText[action].label} ${account.fullName ?? ''}`.trim()}
          onClick={() => onAction(account, action)}
        >
          {accountActionText[action].label}
        </Button>
      ))}
    </div>
  )
}
