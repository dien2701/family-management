import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type StickyActionsProps = {
  /** Nằm trong hộp thoại (bottom sheet): dính đáy sheet thay vì dính trên thanh dưới. */
  inSheet?: boolean
  className?: string
  children: ReactNode
}

// Thanh nút dính đáy màn hình (DESIGN §9): điện thoại dính ngay trên thanh dưới, máy tính nổi thành thẻ căn phải.
// Đặt ở cuối nội dung trang.
// 4.25rem + 1px là chiều cao BottomNav (min-h-14 + p-1.5 hai đầu + viền), cùng đơn vị rem để co giãn theo cỡ chữ.
export function StickyActions({ inSheet = false, className, children }: StickyActionsProps) {
  return (
    <div
      className={cn(
        'sticky z-20 -mx-4 flex gap-3 border-t border-border bg-surface px-4 py-3 *:flex-1',
        'md:justify-end md:*:flex-none',
        // Trong hộp thoại: lề trong máy tính là px-6 (ModalDialog)
        inSheet
          ? 'bottom-0 md:-mx-6 md:px-6'
          : 'bottom-[calc(4.25rem+1px+env(safe-area-inset-bottom))] md:bottom-4 md:mx-0 md:rounded-card md:border md:shadow-card',
        className,
      )}
    >
      {children}
    </div>
  )
}
