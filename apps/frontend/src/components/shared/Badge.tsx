import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type BadgeProps = {
  tone?: 'success' | 'warning' | 'danger' | 'neutral'
  children: ReactNode
  className?: string
}

const TONES: Record<NonNullable<BadgeProps['tone']>, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  neutral: 'bg-secondary text-secondary-fg',
}

// Viên thuốc 14px/500, cặp màu -bg + chữ; luôn có chữ, không chỉ màu (DESIGN §6)
export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
