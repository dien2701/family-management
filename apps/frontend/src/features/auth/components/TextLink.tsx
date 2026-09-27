import type { ComponentProps } from 'react'
import { Link } from 'react-router'
import { cn } from '@/utils/cn'

// Link chữ có vùng chạm ≥44px, màu chữ nhấn đạt tương phản AA (DESIGN §1, §3)
export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        'inline-flex min-h-11 items-center font-semibold text-accent-text underline',
        className,
      )}
      {...props}
    />
  )
}
