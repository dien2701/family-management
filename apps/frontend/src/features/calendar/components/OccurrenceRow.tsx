import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CalendarOccurrence } from '@/types/api'
import { cn } from '@/utils/cn'
import { EVENT_TYPE_META } from '../eventMeta'
import { occurrenceActions, occurrenceDateLine, typeLine } from '../format'
import { DaysTile } from './DaysTile'

type OccurrenceRowProps = {
  occurrence: CalendarOccurrence
  /** Bấm vào hàng (ô số ngày + chữ) để xem chi tiết. */
  onOpen?: (occurrence: CalendarOccurrence) => void
  /** Sự kiện chung: ai được truyền thì thấy nút Sửa (User gửi đề xuất). Giỗ và sinh nhật: chỉ Admin. */
  onEdit?: (occurrence: CalendarOccurrence) => void
  /** Chỉ Admin mới thấy nút Xóa, ở cả sự kiện chung, giỗ và sinh nhật. */
  onDelete?: (occurrence: CalendarOccurrence) => void
  isAdmin?: boolean
  /** Ẩn dòng ngày khi danh sách đã nằm dưới tiêu đề ngày (bảng chi tiết một ngày). */
  hideDate?: boolean
  className?: string
}

/**
 * Một lần xảy ra: ô số ngày còn lại nổi bật bên trái, tên, dòng loại (chấm màu + chữ), dòng ngày dương – âm, ghi chú.
 * Cả phần này là một nút mở chi tiết; nút Sửa/Xóa đứng riêng bên phải.
 */
export function OccurrenceRow({
  occurrence: o,
  onOpen,
  onEdit,
  onDelete,
  isAdmin,
  hideDate,
  className,
}: OccurrenceRowProps) {
  const { showEdit, showDelete, labels } = occurrenceActions(o, {
    isAdmin,
    canEdit: onEdit !== undefined,
    canDelete: onDelete !== undefined,
  })

  const body = (
    <>
      <DaysTile daysUntil={o.daysUntil} className="self-stretch" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-base leading-snug font-semibold break-words text-text group-hover:text-accent-text">
          {o.title}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-medium text-text">
          <span className={cn('size-2.5 shrink-0 rounded-full', EVENT_TYPE_META[o.type].dot)} aria-hidden="true" />
          {typeLine(o)}
        </span>
        {!hideDate && <span className="text-sm text-text-muted">{occurrenceDateLine(o)}</span>}
        {o.description && (
          <span className="line-clamp-2 text-sm break-words text-text-muted">{o.description}</span>
        )}
      </span>
    </>
  )

  return (
    <li
      className={cn(
        'flex items-start gap-2 rounded-card border border-border bg-surface p-4 shadow-card',
        className,
      )}
    >
      {onOpen ? (
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => onOpen(o)}
          className="group flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-field text-left transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {body}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-start gap-3">{body}</div>
      )}
      {(showEdit || showDelete) && (
        <div className="-my-2 -mr-2 flex shrink-0 items-center">
          {showEdit && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`${labels.edit}: ${o.title}`}
              className="text-text-muted hover:text-text"
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
              className="text-danger hover:bg-danger-bg"
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
