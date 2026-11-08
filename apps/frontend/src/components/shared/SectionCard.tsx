import { ChevronRight, type LucideIcon } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/utils/cn'

type SectionCardProps = {
  title: ReactNode
  icon?: LucideIcon
  /** Có thì hiện link "Xem tất cả" (hoặc `moreLabel`) bên phải tiêu đề. */
  moreTo?: string
  moreLabel?: string
  /** Nút/thao tác tự vẽ bên phải tiêu đề (thay cho link "Xem tất cả"). */
  action?: ReactNode
  className?: string
  children: ReactNode
}

// Thẻ có tiêu đề mục 18px/700 màu primary (DESIGN §9)
export function SectionCard({
  title,
  icon: Icon,
  moreTo,
  moreLabel = 'Xem tất cả',
  action,
  className,
  children,
}: SectionCardProps) {
  const id = useId()
  return (
    <section
      aria-labelledby={id}
      className={cn(
        'rounded-card border border-border bg-surface p-4 shadow-card md:p-6',
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          id={id}
          className="flex min-w-0 items-center gap-2 text-lg leading-tight font-bold text-primary"
        >
          {Icon && <Icon className="size-5 shrink-0" aria-hidden="true" />}
          {title}
        </h2>
        {moreTo && (
          <Link
            to={moreTo}
            className="-my-2 inline-flex min-h-11 shrink-0 items-center gap-0.5 rounded-button text-sm font-medium text-accent-text hover:underline"
          >
            {moreLabel}
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        )}
        {action}
      </div>
      {children}
    </section>
  )
}
