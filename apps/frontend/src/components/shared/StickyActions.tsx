import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

// Thanh nút dính ngay trên thanh dưới ở điện thoại, tĩnh ở máy tính (DESIGN §9). Đặt ở cuối nội dung trang.
// 4.25rem + 1px là chiều cao BottomNav (min-h-14 + p-1.5 hai đầu + viền), cùng đơn vị rem để co giãn theo cỡ chữ.
export function StickyActions({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'sticky bottom-[calc(4.25rem+1px+env(safe-area-inset-bottom))] z-20 -mx-4 flex gap-3 border-t border-border bg-surface px-4 py-3 *:flex-1',
        'md:static md:mx-0 md:justify-end md:border-0 md:bg-transparent md:px-0 md:*:flex-none',
        className,
      )}
    >
      {children}
    </div>
  )
}
