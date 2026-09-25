import { UserSearch, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert } from '@/components/shared/Alert'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/client'
import type { AccountAdmin } from '@/types/api'
import { cn } from '@/utils/cn'
import type { AccountAction } from '../api'
import { AccountFilters } from '../components/AccountFilters'
import { AccountList } from '../components/AccountList'
import { useAccountAction, useAccounts, useWaitingCount } from '../hooks'
import { accountActionText, accountErrorText, adminStrings as s } from '../strings'
import { useAccountParams, type AccountTab } from '../useAccountParams'

const SEARCH_DEBOUNCE_MS = 300

type Pending = { account: AccountAdmin; action: AccountAction }

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return (error.code && accountErrorText[error.code]) || error.message
  }
  return 'Có lỗi xảy ra, vui lòng thử lại.'
}

// Quản trị > Tài khoản (IDEA §6.10): duyệt, từ chối, khóa, mở khóa, cấp/gỡ Admin. Quyền do backend quyết định.
export function AccountsPage() {
  const { user } = useAuth()
  const { tab, q, status, role, page, query, update } = useAccountParams()
  const accounts = useAccounts(query)
  const waitingCount = useWaitingCount()
  const action = useAccountAction()
  const [pending, setPending] = useState<Pending | null>(null)

  // Ô tìm giữ chữ đang gõ riêng; chỉ ghi lên URL (và gọi API) sau khi ngừng gõ một lúc
  const [search, setSearch] = useState(q)
  useEffect(() => {
    if (search === q) return
    const timer = window.setTimeout(() => update({ q: search }), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [search, q, update])

  const items = accounts.data?.items ?? []
  const totalPages = accounts.data?.totalPages ?? 0
  const hasFilter = Boolean(q.trim() || status || role)

  function openConfirm(account: AccountAdmin, next: AccountAction) {
    action.reset()
    setPending({ account, action: next })
  }

  function closeConfirm() {
    if (action.isPending) return
    action.reset()
    setPending(null)
  }

  function confirm() {
    if (!pending?.account.id) return
    action.mutate(
      { id: pending.account.id, action: pending.action },
      { onSuccess: () => setPending(null) },
    )
  }

  const text = pending ? accountActionText[pending.action] : null
  const pendingName = pending?.account.fullName ?? ''

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label={s.accounts.tabsLabel}
        onKeyDown={(e) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
          e.preventDefault()
          // Chỉ có hai tab nên mũi tên nào cũng chuyển sang tab còn lại; Home/End về đầu/cuối
          const next: AccountTab =
            e.key === 'Home' ? 'waiting' : e.key === 'End' ? 'all' : tab === 'waiting' ? 'all' : 'waiting'
          update({ tab: next })
          document.getElementById(`accounts-tab-${next}`)?.focus()
        }}
        className="grid grid-cols-2 gap-1 rounded-card border border-border bg-surface p-1 shadow-card md:inline-grid md:w-fit"
      >
        <TabButton
          id="waiting"
          current={tab}
          onSelect={(next) => update({ tab: next })}
          label={s.accounts.tabWaiting}
          count={waitingCount.data}
        />
        <TabButton
          id="all"
          current={tab}
          onSelect={(next) => update({ tab: next })}
          label={s.accounts.tabAll}
        />
      </div>

      <AccountFilters
        search={search}
        onSearchChange={setSearch}
        showFilters={tab === 'all'}
        status={status}
        role={role}
        onStatusChange={(value) => update({ status: value })}
        onRoleChange={(value) => update({ role: value })}
      />

      <div role="tabpanel" id="accounts-panel" aria-labelledby={`accounts-tab-${tab}`}>
        {accounts.isPending ? (
          <ListSkeleton />
        ) : accounts.isError ? (
          <div className="flex flex-col items-start gap-3">
            <Alert className="w-full">{s.accounts.loadFailed}</Alert>
            <Button variant="secondary" onClick={() => void accounts.refetch()}>
              {s.accounts.retry}
            </Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={tab === 'waiting' && !hasFilter ? Users : UserSearch}
            title={tab === 'waiting' && !hasFilter ? s.accounts.emptyWaiting : s.accounts.emptyAll}
            description={
              tab === 'waiting' && !hasFilter ? s.accounts.emptyWaitingHint : s.accounts.emptyAllHint
            }
            action={
              // Địa chỉ có `page` quá lớn (link cũ, danh sách vừa ngắn đi): cho về trang đầu
              page > 0 ? (
                <Button variant="secondary" onClick={() => update({ page: 0 })}>
                  {s.pagination.first}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            <AccountList accounts={items} selfId={user?.id} onAction={openConfirm} />
            <p className="text-center text-sm text-text-muted tabular-nums">
              {s.pagination.total(accounts.data?.totalElements ?? items.length)}
            </p>
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={(next) => update({ page: next })}
              labels={{
                nav: s.pagination.label,
                previous: s.pagination.previous,
                next: s.pagination.next,
                position: s.pagination.page,
              }}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={text?.title(pendingName) ?? ''}
        description={text?.description}
        confirmLabel={text?.confirm ?? ''}
        cancelLabel={s.dialog.cancel}
        danger={text?.danger}
        loading={action.isPending}
        error={action.isError ? errorMessage(action.error) : null}
        onConfirm={confirm}
        onCancel={closeConfirm}
      />
    </div>
  )
}

function TabButton({
  id,
  current,
  onSelect,
  label,
  count,
}: {
  id: AccountTab
  current: AccountTab
  onSelect: (tab: AccountTab) => void
  label: string
  count?: number
}) {
  const selected = current === id
  return (
    <button
      type="button"
      role="tab"
      id={`accounts-tab-${id}`}
      aria-selected={selected}
      aria-controls="accounts-panel"
      // Roving tabindex: chỉ tab đang chọn nằm trong thứ tự Tab, tab còn lại chuyển bằng phím mũi tên
      tabIndex={selected ? 0 : -1}
      onClick={() => onSelect(id)}
      className={cn(
        'flex min-h-11 items-center justify-center gap-2 rounded-button px-4 text-base font-semibold transition-colors duration-200 ease-out md:min-w-40',
        selected
          ? 'bg-primary text-primary-fg'
          : 'text-text-muted hover:bg-surface-muted hover:text-text',
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            'min-w-6 rounded-full px-2 text-center text-sm font-semibold tabular-nums',
            selected ? 'bg-primary-fg text-primary' : 'bg-warning-bg text-warning',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function ListSkeleton() {
  return (
    <div role="status" aria-label={s.accounts.loading} className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          aria-hidden="true"
          className="h-28 animate-pulse rounded-card border border-border bg-surface shadow-card"
        />
      ))}
    </div>
  )
}
