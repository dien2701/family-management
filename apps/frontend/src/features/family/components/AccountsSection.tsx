import { Crown, UserMinus } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import type { Schemas } from '@/types/api'
import { cn } from '@/utils/cn'
import { useRemoveAccount, useTransferManager } from '../hooks'
import { familyStrings as s } from '../strings'

type Account = Schemas['FamilyAccountResponse']
type Action = { kind: 'remove' | 'transfer'; account: Account }

// Tên người Việt thì tên gọi đứng cuối nên lấy chữ cái đầu của từ cuối làm avatar
const initialOf = (fullName?: string) =>
  fullName?.trim().split(/\s+/).at(-1)?.[0]?.toUpperCase() ?? '?'

type AccountsSectionProps = {
  accounts: Account[]
  currentUserId: number | undefined
  isManager: boolean
}

export function AccountsSection({ accounts, currentUserId, isManager }: AccountsSectionProps) {
  const [action, setAction] = useState<Action | null>(null)
  const remove = useRemoveAccount()
  const transfer = useTransferManager()
  const busy = action?.kind === 'remove' ? remove : transfer

  function confirm() {
    const userId = action?.account.id
    if (!action || userId === undefined) return
    // Chuyển quyền: phiên kết thúc (backend thu hồi token) nên không cần đóng hộp thoại
    if (action.kind === 'transfer') transfer.mutate(userId)
    else remove.mutate(userId, { onSuccess: () => setAction(null) })
  }

  function open(next: Action) {
    remove.reset()
    transfer.reset()
    setAction(next)
  }

  return (
    <section
      aria-labelledby="accounts-title"
      className="rounded-card border border-border bg-surface p-4 shadow-card md:p-6"
    >
      <h2 id="accounts-title" className="text-lg leading-tight font-semibold">
        {s.page.accountsTitle(accounts.length)}
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {accounts.map((account) => {
          const isSelf = account.id === currentUserId
          const isAccountManager = account.familyRole === 'MANAGER'
          const canManage = isManager && !isSelf && !isAccountManager
          return (
            <li
              key={account.id}
              className="flex flex-col gap-3 rounded-field bg-surface-muted p-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-semibold text-secondary-fg"
                >
                  {initialOf(account.fullName)}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold break-words">{account.fullName}</span>
                    {isSelf && (
                      <span className="rounded-full bg-secondary px-3 py-0.5 text-sm font-medium text-secondary-fg">
                        {s.page.you}
                      </span>
                    )}
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-sm font-medium',
                        isAccountManager
                          ? 'bg-warning-bg text-warning'
                          : 'bg-success-bg text-success',
                      )}
                    >
                      {isAccountManager && <Crown className="size-4" aria-hidden="true" />}
                      {isAccountManager ? s.page.manager : s.page.member}
                    </span>
                  </div>
                  {account.email && (
                    <p className="truncate text-sm text-text-muted">{account.email}</p>
                  )}
                </div>
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1 md:flex-none"
                    aria-label={s.accounts.transferLabel(account.fullName ?? '')}
                    onClick={() => open({ kind: 'transfer', account })}
                  >
                    <Crown aria-hidden="true" />
                    {s.accounts.transferShort}
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 text-danger md:flex-none"
                    aria-label={s.accounts.removeLabel(account.fullName ?? '')}
                    onClick={() => open({ kind: 'remove', account })}
                  >
                    <UserMinus aria-hidden="true" />
                    {s.accounts.removeShort}
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={action !== null}
        danger={action?.kind === 'remove'}
        title={
          action?.kind === 'transfer'
            ? s.accounts.transferTitle(action.account.fullName ?? '')
            : s.accounts.removeTitle(action?.account.fullName ?? '')
        }
        description={
          action?.kind === 'transfer'
            ? s.accounts.transferDescription
            : s.accounts.removeDescription
        }
        confirmLabel={action?.kind === 'transfer' ? s.accounts.transfer : s.accounts.remove}
        cancelLabel={s.dialog.cancel}
        loading={busy.isPending}
        error={busy.isError ? busy.error.message : null}
        onCancel={() => setAction(null)}
        onConfirm={confirm}
      />
    </section>
  )
}
