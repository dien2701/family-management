import { cn } from '@/utils/cn'
import { daysLabel } from '../format'

/** Ô số ngày: số lớn + "ngày nữa"/"ngày trước"; hôm nay nền primary, ngày mai chỉ ghi chữ, đã qua màu nhạt. */
export function DaysTile({ daysUntil, className }: { daysUntil: number; className?: string }) {
  const word = daysUntil === 0 || daysUntil === 1
  return (
    <span
      className={cn(
        'flex w-16 shrink-0 flex-col items-center justify-center rounded-field px-1 py-2 text-center',
        daysUntil === 0
          ? 'bg-primary text-primary-fg'
          : daysUntil > 0
            ? 'bg-secondary text-secondary-fg'
            : 'bg-surface-muted text-text-muted',
        className,
      )}
    >
      {word ? (
        <span className="text-sm leading-tight font-bold">{daysLabel(daysUntil)}</span>
      ) : (
        <>
          <span className="text-2xl leading-none font-bold tabular-nums">{Math.abs(daysUntil)}</span>
          <span className="mt-1 text-sm leading-tight">{daysUntil > 0 ? 'ngày nữa' : 'ngày trước'}</span>
        </>
      )}
    </span>
  )
}
