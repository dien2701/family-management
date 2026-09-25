import { Pencil } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/ui/button'
import type { CalendarOccurrence } from '@/types/api'
import { cn } from '@/utils/cn'
import { EVENT_TYPE_META } from '../eventMeta'
import { daysLabel, occurrenceDateLine, ordinalLabel } from '../format'
import { calendarStrings } from '../strings'

type OccurrenceRowProps = {
  occurrence: CalendarOccurrence
  /** Có thì Admin thấy nút Sửa ở sự kiện chung. */
  onEdit?: (eventId: number) => void
  /** Ẩn dòng ngày khi danh sách đã nằm dưới tiêu đề ngày (bảng chi tiết một ngày). */
  hideDate?: boolean
  className?: string
}

/** Một lần xảy ra: icon và nhãn theo loại (không chỉ màu), tên, ngày dương – âm, "còn N ngày", "giỗ lần thứ N", "tròn N tuổi". */
export function OccurrenceRow({ occurrence: o, onEdit, hideDate, className }: OccurrenceRowProps) {
  const meta = EVENT_TYPE_META[o.type]
  const Icon = meta.icon
  const ordinal = ordinalLabel(o)

  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-field border border-border bg-surface p-3',
        className,
      )}
    >
      <span
        className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', meta.soft)}
      >
        <Icon className={cn('size-6', meta.text)} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-base leading-snug font-semibold break-words">
          {o.memberId !== null ? (
            <Link
              to={`/thanh-vien/${o.memberId}`}
              className="cursor-pointer hover:text-accent-text hover:underline"
            >
              {o.title}
            </Link>
          ) : (
            o.title
          )}
        </h3>
        {!hideDate && <p className="text-sm text-text-muted">{occurrenceDateLine(o)}</p>}
        {o.description && <p className="text-sm break-words text-text-muted">{o.description}</p>}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge>{meta.label}</Badge>
          {ordinal && <Badge>{ordinal}</Badge>}
          <Badge
            tone={o.daysUntil === 0 ? 'warning' : 'neutral'}
            className="tabular-nums"
          >
            {daysLabel(o.daysUntil)}
          </Badge>
        </div>
      </div>
      {onEdit && o.eventId !== null && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${calendarStrings.occurrence.edit}: ${o.title}`}
          className="-mt-1 -mr-1 shrink-0"
          onClick={() => onEdit(o.eventId!)}
        >
          <Pencil />
        </Button>
      )}
    </li>
  )
}
