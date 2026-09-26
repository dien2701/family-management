import { Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

// Trạng thái rỗng: icon lớn + một câu ngắn + một nút gợi ý (DESIGN §6)
export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface px-4 py-12 text-center shadow-card">
      <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-fg">
        <Icon className="size-8" aria-hidden="true" />
      </span>
      <h2 className="text-lg leading-tight font-semibold">{title}</h2>
      {description && <p className="max-w-md text-text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
