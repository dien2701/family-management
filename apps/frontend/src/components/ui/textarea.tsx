import type { ComponentProps } from 'react'
import { cn } from '@/utils/cn'

type TextareaProps = ComponentProps<'textarea'> & { invalid?: boolean }

// Cùng kiểu với Input (DESIGN §6): bo 12px, nền surface-muted, chữ 16px
export function Textarea({ className, invalid, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        'min-h-24 w-full resize-y rounded-field border bg-surface-muted px-3 py-2.5 text-base text-text placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-50',
        invalid ? 'border-danger' : 'border-border',
        className,
      )}
      {...props}
    />
  )
}
