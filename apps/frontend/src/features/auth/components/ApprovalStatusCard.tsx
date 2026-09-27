import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type ApprovalStatusCardProps = {
  icon: LucideIcon
  /** `warning` cho chờ duyệt, `danger` cho không được duyệt (kèm icon và chữ, không chỉ dựa vào màu). */
  tone: 'warning' | 'danger'
  title: string
  description: string
  children?: ReactNode
}

// Thẻ giữa màn hình cho trang chờ duyệt và trang không được duyệt (DESIGN §6: trạng thái rỗng, badge)
export function ApprovalStatusCard({
  icon: Icon,
  tone,
  title,
  description,
  children,
}: ApprovalStatusCardProps) {
  return (
    <section
      aria-labelledby="approval-title"
      className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-card border border-border bg-surface p-4 text-center shadow-card md:p-6"
    >
      <span
        className={cn(
          'flex size-16 items-center justify-center rounded-full',
          tone === 'warning' ? 'bg-warning-bg text-warning' : 'bg-danger-bg text-danger',
        )}
      >
        <Icon className="size-8" aria-hidden="true" />
      </span>
      <h2 id="approval-title" className="text-lg leading-tight font-semibold">
        {title}
      </h2>
      <p className="text-text-muted">{description}</p>
      {children && <div className="mt-2 flex w-full flex-col gap-4">{children}</div>}
    </section>
  )
}
