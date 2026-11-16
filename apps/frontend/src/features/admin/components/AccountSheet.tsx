import { useId } from 'react'
import { Link } from 'react-router'
import { ModalDialog } from '@/components/shared/ModalDialog'
import { Select } from '@/components/ui/select'
import type { AccountAdmin } from '@/types/api'
import { formatDate } from '@/utils/date'
import { canChangeRole } from '../accountRules'
import type { AccountAction, LinkAction, SystemRole } from '../api'
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
  /** Chọn vai trò khác trong ô chọn: trang mở hộp xác nhận chồng lên, hộp chi tiết vẫn mở. */
  onRoleChange: (account: AccountAdmin, role: SystemRole) => void
}

/** Thứ tự từ ít quyền tới nhiều quyền. */
const ROLES: SystemRole[] = ['USER', 'BRANCH_HEAD', 'ADMIN']

/** Chi tiết một tài khoản: thông tin đầy đủ và mọi thao tác (bottom sheet ở điện thoại, modal từ 768px). */
export function AccountSheet({ account, selfId, onClose, onAction, onLinkAction, onRoleChange }: AccountSheetProps) {
  const roleId = useId()
  const editableRole = account !== null && canChangeRole(account, selfId)
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
            <dt className="text-text-muted">
              {editableRole ? <label htmlFor={roleId}>{s.accounts.columns.role}</label> : s.accounts.columns.role}
            </dt>
            <dd>
              {editableRole ? (
                // Ô chọn có kiểm soát: hủy ở hộp xác nhận thì ô tự về vai trò hiện tại (DECISIONS #106)
                <Select
                  id={roleId}
                  className="max-w-56 cursor-pointer"
                  value={account.systemRole ?? 'USER'}
                  onChange={(e) => onRoleChange(account, e.target.value as SystemRole)}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {s.role[role]}
                    </option>
                  ))}
                </Select>
              ) : (
                <AccountRoleBadge account={account} />
              )}
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
            {account.deletedAt && (
              <>
                <dt className="text-text-muted">{s.accounts.deletedAt}</dt>
                <dd className="tabular-nums">{formatDate(account.deletedAt)}</dd>
              </>
            )}
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
