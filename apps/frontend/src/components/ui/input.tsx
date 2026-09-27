import type { ComponentProps } from 'react'
import { cn } from '@/utils/cn'

type InputProps = ComponentProps<'input'> & { invalid?: boolean }

// Cao 44px, bo 12px, nền surface-muted, viền border; lỗi thì viền danger (DESIGN §6). Chữ 16px để iOS không tự phóng to.
export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        'min-h-11 w-full rounded-field border bg-surface-muted px-3 text-base text-text placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-50',
        invalid ? 'border-danger' : 'border-border',
        className,
      )}
      {...props}
    />
  )
}
