import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  cancelLabel: string
  /** `danger` cho thao tác không hoàn tác được (loại, thu hồi, rời). */
  danger?: boolean
  loading?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

// Dùng <dialog> gốc của trình duyệt: có sẵn khóa focus, đóng bằng Esc và trả focus về nút đã mở (DESIGN §6).
// Điện thoại: bottom sheet bo góc trên; ≥768px: modal giữa màn hình rộng tối đa 480px.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger,
  loading,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog || typeof dialog.showModal !== 'function') return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Khóa cuộn nền khi đang mở
  useEffect(() => {
    if (!open) return
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = previous
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Esc: báo lên cha để đóng, không cho đóng khi đang gửi
      onCancel={(e) => {
        e.preventDefault()
        if (!loading) onCancel()
      }}
      className="m-0 mt-auto w-full max-w-none rounded-t-card border border-border bg-surface p-0 text-text shadow-overlay backdrop:bg-text/40 md:m-auto md:max-w-[480px] md:rounded-card"
    >
      <div className="flex flex-col gap-4 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg leading-tight font-semibold">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Đóng"
            className="-mt-2 -mr-2"
            disabled={loading}
            onClick={onCancel}
          >
            <X />
          </Button>
        </div>
        <div className="text-text-muted">{description}</div>
        {error && (
          <p role="alert" className="text-base font-medium text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button variant="secondary" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
