import { Link } from 'react-router'
import { ModalDialog } from '@/components/shared/ModalDialog'
import type { AccountAdmin } from '@/types/api'
import { formatDate } from '@/utils/date'
import type { AccountAction, LinkAction } from '../api'
import { adminStrings as s } from '../strings'
import { AccountActions } from './AccountActions'
import { AccountAvatar } from './AccountList'
import { AccountRoleBadge, AccountStatusBadge } from './AccountStatusBadges'

type AccountSheetProps = {
  /** `null` là đóng. */
  account: AccountAdmin | null
  selfId: number | undefined
  onClose: () => void
  onAction: (account: AccountAdmin, action: AccountAction) => void
  onLinkAction: (account: AccountAdmin, action: LinkAction) => void
}

/** Chi tiết một tài khoản: thông tin đầy đủ và mọi thao tác (bottom sheet ở điện thoại, modal từ 768px). */
export function AccountSheet({ account, selfId, onClose, onAction, onLinkAction }: AccountSheetProps) {
  return (
    <ModalDialog open={account !== null} title={s.accounts.details} onClose={onClose}>
      {account && (
        <>
          <div className="flex items-center gap-3">
            <AccountAvatar name={account.fullName} />
            <div className="min-w-0">
              <p className="text-lg leading-snug font-bold [overflow-wrap:anywhere]">{account.fullName}</p>
              <p className="text-sm break-all text-text-muted">{account.email}</p>
            </div>
          </div>

          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3">
            <dt className="text-text-muted">{s.accounts.columns.status}</dt>
            <dd>
              <AccountStatusBadge account={account} />
            </dd>
            <dt className="text-text-muted">{s.accounts.columns.role}</dt>
            <dd>
              <AccountRoleBadge account={account} />
            </dd>
            <dt className="text-text-muted">{s.accounts.columns.member}</dt>
            <dd className="[overflow-wrap:anywhere]">
              {account.member ? (
                <Link
                  to={`/thanh-vien/${account.member.id}`}
                  className="font-medium text-accent-text underline-offset-2 hover:underline"
                >
                  {account.member.fullName}
                </Link>
              ) : (
                <span className="text-text-muted">{s.accounts.notLinked}</span>
              )}
            </dd>
            <dt className="text-text-muted">{s.accounts.columns.createdAt}</dt>
            <dd className="tabular-nums">{formatDate(account.createdAt)}</dd>
          </dl>

          <AccountActions
            account={account}
            selfId={selfId}
            onAction={(a, action) => {
              onClose()
              onAction(a, action)
            }}
            onLinkAction={(a, action) => {
              onClose()
              onLinkAction(a, action)
            }}
          />
        </>
      )}
    </ModalDialog>
  )
}
