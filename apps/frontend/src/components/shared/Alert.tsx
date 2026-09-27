import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type AlertProps = { variant?: 'danger' | 'info' | 'success'; children: ReactNode; className?: string }

// Luôn có icon và chữ, không chỉ dựa vào màu (DESIGN §1)
export function Alert({ variant = 'danger', children, className }: AlertProps) {
  const Icon = variant === 'danger' ? CircleAlert : variant === 'success' ? CircleCheck : Info
  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-field px-4 py-3 text-base',
        variant === 'danger' ? 'bg-danger-bg text-danger' : 'bg-secondary text-secondary-fg',
        className,
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
