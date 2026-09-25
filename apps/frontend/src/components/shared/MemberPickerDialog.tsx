import { Check, Search, X } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { MemberSummary } from '@/types/api'
import { cn } from '@/utils/cn'
import { Alert } from './Alert'
import { MemberIdentity } from './MemberIdentity'
import { ModalDialog } from './ModalDialog'

export type MemberPickerLabels = {
  search: string
  searchPlaceholder: string
  results: string
  loading: string
  loadFailed: string
  retry: string
  /** Chưa gõ gì mà không có thành viên nào để chọn. */
  empty: string
  noMatch: string
  /** Đang hiện `shown` trên tổng `total` kết quả. */
  truncated: (shown: number, total: number) => string
  selected: (name: string) => string
  clearSelection: string
  cancel: string
}

type MemberPickerDialogProps = {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel: string
  labels: MemberPickerLabels
  query: string
  onQueryChange: (value: string) => void
  members: MemberSummary[]
  /** Tổng số kết quả khớp (danh sách có thể chỉ là trang đầu). */
  totalCount?: number
  loading?: boolean
  loadFailed?: boolean
  onRetry?: () => void
  /** Người không chọn được: id → lý do hiện ngay trên dòng (ví dụ "Đã có trong danh sách"). */
  disabledReasons?: Record<number, string>
  selected: MemberSummary | null
  onSelect: (member: MemberSummary | null) => void
  /** Phần nhập thêm, chỉ hiện sau khi đã chọn một người (ví dụ nhãn của người thân). */
  children?: ReactNode
  error?: string | null
  submitting?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Hộp chọn một thành viên: ô tìm không dấu + danh sách kết quả. Chỉ nhận props (không gọi API), nơi dùng lo
 * việc tìm, nên tìm được trong toàn bộ thành viên. Điện thoại là bottom sheet (DESIGN §6).
 */
export function MemberPickerDialog({
  open,
  title,
  description,
  confirmLabel,
  labels,
  query,
  onQueryChange,
  members,
  totalCount,
  loading,
  loadFailed,
  onRetry,
  disabledReasons,
  selected,
  onSelect,
  children,
  error,
  submitting,
  onConfirm,
  onCancel,
}: MemberPickerDialogProps) {
  const searchId = useId()
  const total = totalCount ?? 0
  const truncated = total > members.length

  return (
    <ModalDialog open={open} title={title} busy={submitting} onClose={onCancel}>
      {description && <p className="text-text-muted">{description}</p>}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={searchId} className="text-base font-medium">
          {labels.search}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <Input
            id={searchId}
            type="search"
            value={query}
            placeholder={labels.searchPlaceholder}
            autoComplete="off"
            // Mở hộp là gõ tìm luôn; nếu không thì focus rơi vào nút đóng
            autoFocus
            className="pl-10"
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
      </div>

      <div className="min-h-24">
        {loadFailed ? (
          <div className="flex flex-col items-start gap-3">
            <Alert className="w-full">{labels.loadFailed}</Alert>
            {onRetry && (
              <Button variant="secondary" onClick={onRetry}>
                {labels.retry}
              </Button>
            )}
          </div>
        ) : loading && members.length === 0 ? (
          <p role="status" className="py-6 text-center text-text-muted">
            {labels.loading}
          </p>
        ) : members.length === 0 ? (
          <p className="py-6 text-center text-text-muted">
            {query.trim() ? labels.noMatch : labels.empty}
          </p>
        ) : (
          <ul
            aria-label={labels.results}
            className="max-h-64 overflow-y-auto rounded-field border border-border md:max-h-72"
          >
            {members.map((member) => {
              const reason = disabledReasons?.[member.id]
              const isSelected = selected?.id === member.id
              return (
                <li key={member.id} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    disabled={Boolean(reason) || submitting}
                    onClick={() => onSelect(isSelected ? null : member)}
                    className={cn(
                      'flex min-h-14 w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors duration-200 ease-out disabled:cursor-not-allowed',
                      isSelected ? 'bg-secondary' : 'hover:bg-surface-muted',
                      reason && 'opacity-60',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <MemberIdentity member={member} />
                    </span>
                    {reason && (
                      <span className="shrink-0 text-sm font-medium text-text-muted">{reason}</span>
                    )}
                    {isSelected && (
                      <Check className="size-5 shrink-0 text-primary" aria-hidden="true" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {truncated && !loadFailed && (
          <p className="mt-2 text-sm text-text-muted tabular-nums">
            {labels.truncated(members.length, total)}
          </p>
        )}
      </div>

      {selected && (
        <>
          <div className="flex items-center justify-between gap-2 rounded-field bg-secondary px-3 py-2 text-secondary-fg">
            <span className="min-w-0 font-medium [overflow-wrap:anywhere]">
              {labels.selected(selected.fullName)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={labels.clearSelection}
              disabled={submitting}
              onClick={() => onSelect(null)}
            >
              <X />
            </Button>
          </div>
          {children}
        </>
      )}

      {error && (
        <p role="alert" className="text-base font-medium text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Button variant="secondary" disabled={submitting} onClick={onCancel}>
          {labels.cancel}
        </Button>
        <Button loading={submitting} disabled={!selected} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </ModalDialog>
  )
}
