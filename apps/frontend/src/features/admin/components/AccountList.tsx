import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/ui/button'
import type { AccountAdmin } from '@/types/api'
import { initialOf } from '@/utils/text'
import { actionsFor, displayStatusOf } from '../accountRules'
import type { AccountAction } from '../api'
import { accountActionText, adminStrings as s } from '../strings'
import { AccountStatusBadge } from './AccountStatusBadges'

type AccountListProps = {
  accounts: AccountAdmin[]
  selfId: number | undefined
  onOpen: (account: AccountAdmin) => void
  onAction: (account: AccountAdmin, action: AccountAction) => void
}

export function AccountAvatar({ name }: { name?: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-semibold text-secondary-fg"
    >
      {initialOf(name)}
    </span>
  )
}

/**
 * Danh sách gọn, một dạng cho mọi khổ màn hình: mỗi hàng là ảnh chữ cái, họ tên, email; chỉ hiện nhãn khi khác
 * thường (chờ duyệt, bị từ chối, bị khóa, Admin). Bấm hàng mở hộp chi tiết có mọi thao tác. Riêng tài khoản chờ
 * duyệt có sẵn Duyệt/Từ chối ngay dưới hàng vì đó là việc làm thường xuyên nhất.
 */
export function AccountList({ accounts, selfId, onOpen, onAction }: AccountListProps) {
  return (
    <ul
      aria-label={s.accounts.listLabel}
      className="divide-y divide-border rounded-card border border-border bg-surface px-4 shadow-card"
    >
      {accounts.map((account) => {
        const isSelf = account.id === selfId
        const status = displayStatusOf(account)
        const quick = status === 'waiting' ? actionsFor(account, selfId) : []
        const name = account.fullName ?? ''
        return (
          <li key={account.id} className="flex flex-col gap-2 py-3">
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => onOpen(account)}
              className="-mx-2 flex min-h-14 cursor-pointer items-center gap-3 rounded-field px-2 text-left transition-colors duration-200 ease-out hover:bg-surface-muted"
            >
              <AccountAvatar name={name} />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-x-2 font-semibold text-text">
                  {/* Họ tên dài xuống dòng thay vì bị cắt, để Admin thấy đủ tên trước khi duyệt */}
                  <span className="[overflow-wrap:anywhere]">{name}</span>
                  {isSelf && <Badge>{s.accounts.you}</Badge>}
                </span>
                <span className="truncate text-sm text-text-muted">{account.email}</span>
                {(status !== 'approved' || account.systemRole === 'ADMIN') && (
                  <span className="flex flex-wrap gap-1.5">
                    {status !== 'approved' && <AccountStatusBadge account={account} />}
                    {account.systemRole === 'ADMIN' && <Badge>{s.role.ADMIN}</Badge>}
                  </span>
                )}
              </span>
              <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden="true" />
            </button>
            {quick.length > 0 && (
              <div className="grid grid-cols-2 gap-2 md:ml-14 md:max-w-80">
                {quick.map((action) => (
                  <Button
                    key={action}
                    variant={action === 'approve' ? 'primary' : 'outline'}
                    className={action === 'approve' ? undefined : 'text-danger'}
                    aria-label={`${accountActionText[action].label} ${name}`.trim()}
                    onClick={() => onAction(account, action)}
                  >
                    {accountActionText[action].label}
                  </Button>
                ))}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
