import { Pencil, Trash2 } from 'lucide-react'
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
  /** Sự kiện chung: ai được truyền thì thấy nút Sửa (User gửi đề xuất). Giỗ và sinh nhật: chỉ Admin. */
  onEdit?: (occurrence: CalendarOccurrence) => void
  /** Chỉ Admin mới thấy nút Xóa, ở cả sự kiện chung, giỗ và sinh nhật. */
  onDelete?: (occurrence: CalendarOccurrence) => void
  isAdmin?: boolean
  /** Ẩn dòng ngày khi danh sách đã nằm dưới tiêu đề ngày (bảng chi tiết một ngày). */
  hideDate?: boolean
  className?: string
}

/** Một lần xảy ra: icon và nhãn theo loại (không chỉ màu), tên, ngày dương – âm, "còn N ngày", "giỗ lần thứ N", "tròn N tuổi". */
export function OccurrenceRow({
  occurrence: o,
  onEdit,
  onDelete,
  isAdmin,
  hideDate,
  className,
}: OccurrenceRowProps) {
  const meta = EVENT_TYPE_META[o.type]
  const Icon = meta.icon
  const ordinal = ordinalLabel(o)
  const custom = o.eventId !== null
  const editable = custom || (isAdmin === true && o.memberId !== null)
  const showEdit = onEdit !== undefined && editable
  const showDelete = onDelete !== undefined && isAdmin === true && editable
  const t = calendarStrings.occurrence
  const labels = custom
    ? { edit: t.edit, delete: t.delete }
    : o.type === 'BIRTHDAY'
      ? { edit: t.editBirthday, delete: t.deleteBirthday }
      : { edit: t.editMemorial, delete: t.deleteMemorial }

  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-card border border-border bg-surface p-4 shadow-card transition-colors hover:border-accent',
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
      {(showEdit || showDelete) && (
        <div className="-mt-1 -mr-1 flex shrink-0 items-center">
          {showEdit && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`${labels.edit}: ${o.title}`}
              onClick={() => onEdit!(o)}
            >
              <Pencil />
            </Button>
          )}
          {showDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`${labels.delete}: ${o.title}`}
              className="text-danger"
              onClick={() => onDelete!(o)}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      )}
    </li>
  )
}
