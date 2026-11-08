import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router'

type IconTileProps = {
  to: string
  icon: LucideIcon
  label: string
  /** Số việc đang chờ: > 0 thì hiện chấm số ở góc ô icon, kèm chữ cho trình đọc màn hình. */
  count?: number
  countLabel?: (count: number) => string
}

// Ô lối tắt: icon trong ô bo 12px nền secondary + nhãn 14px tối đa 2 dòng; đặt trong lưới 4 cột (DESIGN §9)
export function IconTile({ to, icon: Icon, label, count, countLabel }: IconTileProps) {
  const hasCount = count !== undefined && count > 0
  return (
    <Link
      to={to}
      className="flex min-h-11 flex-col items-center gap-2 rounded-field px-1 py-2 text-center transition-colors duration-200 ease-out hover:bg-surface-muted"
    >
      <span className="relative flex size-12 items-center justify-center rounded-field bg-secondary text-secondary-fg">
        <Icon className="size-6" aria-hidden="true" />
        {hasCount && (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -right-1.5 min-w-6 rounded-full bg-warning-bg px-1.5 text-center text-sm leading-6 font-semibold text-warning tabular-nums ring-2 ring-surface"
          >
            {count}
          </span>
        )}
      </span>
      <span className="line-clamp-2 text-sm leading-tight font-medium text-text">{label}</span>
      {hasCount && <span className="sr-only">{countLabel ? countLabel(count) : count}</span>}
    </Link>
  )
}
