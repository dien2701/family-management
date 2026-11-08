import { cn } from '@/utils/cn'
import { EVENT_TYPES, EVENT_TYPE_META } from '../eventMeta'
import { calendarStrings } from '../strings'

/** Chú giải chấm màu, luôn kèm chữ (DESIGN §1). */
export function EventLegend({ className }: { className?: string }) {
  return (
    <ul
      aria-label={calendarStrings.legend.title}
      className={cn('flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-muted', className)}
    >
      {EVENT_TYPES.map((type) => {
        const { label, dot } = EVENT_TYPE_META[type]
        return (
          <li key={type} className="flex items-center gap-1.5">
            <span className={cn('size-2.5 rounded-full', dot)} aria-hidden="true" />
            <span>{label}</span>
          </li>
        )
      })}
    </ul>
  )
}
