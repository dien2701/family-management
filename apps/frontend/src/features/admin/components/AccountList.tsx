import { Link } from 'react-router'
import { Badge } from '@/components/shared/Badge'
import type { AccountAdmin } from '@/types/api'
import { formatDate } from '@/utils/date'
import { initialOf } from '@/utils/text'
import type { AccountAction, LinkAction } from '../api'
import { adminStrings as s } from '../strings'
import { AccountActions } from './AccountActions'
import { AccountRoleBadge, AccountStatusBadge } from './AccountStatusBadges'

type AccountListProps = {
  accounts: AccountAdmin[]
  selfId: number | undefined
  onAction: (account: AccountAdmin, action: AccountAction) => void
  onLinkAction: (account: AccountAdmin, action: LinkAction) => void
}

function Avatar({ name }: { name?: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-semibold text-secondary-fg"
    >
      {initialOf(name)}
    </span>
  )
}

function Identity({ account, isSelf }: { account: AccountAdmin; isSelf: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={account.fullName} />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 font-semibold">
          {/* Họ tên dài xuống dòng thay vì bị cắt, để Admin thấy đủ tên trước khi duyệt */}
          <span className="[overflow-wrap:anywhere]">{account.fullName}</span>
          {isSelf && <Badge>{s.accounts.you}</Badge>}
        </p>
        <p className="text-sm break-all text-text-muted">{account.email}</p>
      </div>
    </div>
  )
}

/** Thành viên đang liên kết với tài khoản (link tới hồ sơ), hoặc "Chưa liên kết". */
function LinkedMember({ account }: { account: AccountAdmin }) {
  if (!account.member) return <span className="text-text-muted">{s.accounts.notLinked}</span>
  return (
    <Link
      to={`/thanh-vien/${account.member.id}`}
      className="font-medium text-accent-text underline-offset-2 [overflow-wrap:anywhere] hover:underline"
    >
      {account.member.fullName}
    </Link>
  )
}

// Điện thoại (<768px): danh sách thẻ. Máy tính: bảng (DESIGN §6, IDEA §6.3). Cả hai cùng một dữ liệu;
// phần không hiện được ẩn bằng CSS nên trình đọc màn hình chỉ gặp một dạng.
export function AccountList({ accounts, selfId, onAction, onLinkAction }: AccountListProps) {
  return (
    <>
      <ul aria-label={s.accounts.listLabel} className="flex flex-col gap-4 md:hidden">
        {accounts.map((account) => (
          <li
            key={account.id}
            className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card"
          >
            <Identity account={account} isSelf={account.id === selfId} />
            <p className="text-sm">
              <span className="text-text-muted">{s.accounts.memberLabel}: </span>
              <LinkedMember account={account} />
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <AccountStatusBadge account={account} />
              <AccountRoleBadge account={account} />
              <span className="text-sm text-text-muted">
                {s.accounts.registeredAt(formatDate(account.createdAt))}
              </span>
            </div>
            <AccountActions
              account={account}
              selfId={selfId}
              onAction={onAction}
              onLinkAction={onLinkAction}
            />
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-card border border-border bg-surface shadow-card md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{s.accounts.listLabel}</caption>
          <thead className="bg-surface-muted text-sm font-semibold text-text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">
                {s.accounts.columns.account}
              </th>
              <th scope="col" className="px-4 py-3">
                {s.accounts.columns.role}
              </th>
              <th scope="col" className="px-4 py-3">
                {s.accounts.columns.status}
              </th>
              <th scope="col" className="px-4 py-3">
                {s.accounts.columns.member}
              </th>
              <th scope="col" className="px-4 py-3">
                {s.accounts.columns.createdAt}
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                {s.accounts.columns.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="min-h-12 border-t border-border even:bg-surface-muted">
                <td className="max-w-64 px-4 py-3">
                  <Identity account={account} isSelf={account.id === selfId} />
                </td>
                <td className="px-4 py-3">
                  <AccountRoleBadge account={account} />
                </td>
                <td className="px-4 py-3">
                  <AccountStatusBadge account={account} />
                </td>
                <td className="max-w-48 px-4 py-3">
                  <LinkedMember account={account} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                  {formatDate(account.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <AccountActions
              account={account}
              selfId={selfId}
              onAction={onAction}
              onLinkAction={onLinkAction}
            />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
