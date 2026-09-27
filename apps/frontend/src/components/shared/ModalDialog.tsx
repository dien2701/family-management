import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type ModalDialogProps = {
  open: boolean
  title: string
  /** Đang gửi dữ liệu: không cho đóng bằng Esc hay nút đóng. */
  busy?: boolean
  onClose: () => void
  children: ReactNode
}

// Hộp thoại có nội dung tùy ý (form, danh sách chọn). Cùng kiểu với ConfirmDialog (DESIGN §6): <dialog> gốc có sẵn
// khóa focus, đóng bằng Esc và trả focus về nút đã mở. Điện thoại: bottom sheet bo góc trên; ≥768px: modal giữa
// màn hình rộng tối đa 480px. Nội dung chỉ được dựng khi mở nên state bên trong tự về ban đầu ở mỗi lần mở.
export function ModalDialog({ open, title, busy, onClose, children }: ModalDialogProps) {
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
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onClose()
      }}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none flex-col rounded-t-card border border-border bg-surface p-0 text-text shadow-overlay backdrop:bg-text/40 open:flex md:m-auto md:max-h-[85dvh] md:max-w-[480px] md:rounded-card"
    >
      {open && (
        <>
          <div className="flex items-start justify-between gap-3 px-4 pt-4 md:px-6 md:pt-6">
            <h2 id={titleId} className="text-lg leading-tight font-semibold">
              {title}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Đóng"
              className="-mt-2 -mr-2"
              disabled={busy}
              onClick={onClose}
            >
              <X />
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6 md:pb-6">
            {children}
          </div>
        </>
      )}
    </dialog>
  )
}
