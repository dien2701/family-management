import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/utils/cn'

type CheckboxProps = Omit<ComponentProps<'input'>, 'type' | 'children'> & {
  label: ReactNode
  invalid?: boolean
}

// Cả dòng là vùng bấm ≥44px; ô tick gốc của trình duyệt để giữ hỗ trợ bàn phím và trình đọc màn hình
export function Checkbox({ label, invalid, className, ...props }: CheckboxProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-base">
      <input
        type="checkbox"
        aria-invalid={invalid || undefined}
        className={cn(
          'mt-0.5 size-5 shrink-0 cursor-pointer rounded-md accent-primary',
          invalid && 'outline-2 outline-danger',
          className,
        )}
        {...props}
      />
      <span>{label}</span>
    </label>
  )
}
