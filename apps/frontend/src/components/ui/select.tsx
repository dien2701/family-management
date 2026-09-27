import type { ComponentProps } from 'react'
import { cn } from '@/utils/cn'

type SelectProps = ComponentProps<'select'> & { invalid?: boolean }

// <select> gốc của trình duyệt: có sẵn bàn phím, trình đọc màn hình và bộ chọn của điện thoại.
// Cao 44px, bo 12px, cùng kiểu với Input (DESIGN §6); chữ 16px để iOS không tự phóng to.
export function Select({ className, invalid, ...props }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        'min-h-11 w-full rounded-field border bg-surface-muted px-3 text-base text-text disabled:cursor-not-allowed disabled:opacity-50',
        invalid ? 'border-danger' : 'border-border',
        className,
      )}
      {...props}
    />
  )
}
