import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router'

type IconTileProps = { to: string; icon: LucideIcon; label: string }

// Ô lối tắt: icon trong ô bo 12px nền secondary + nhãn 14px tối đa 2 dòng; đặt trong lưới 4 cột (DESIGN §9)
export function IconTile({ to, icon: Icon, label }: IconTileProps) {
  return (
    <Link
      to={to}
      className="flex min-h-11 flex-col items-center gap-2 rounded-field px-1 py-2 text-center transition-colors duration-200 ease-out hover:bg-surface-muted"
    >
      <span className="flex size-12 items-center justify-center rounded-field bg-secondary text-secondary-fg">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <span className="line-clamp-2 text-sm leading-tight font-medium text-text">{label}</span>
    </Link>
  )
}
