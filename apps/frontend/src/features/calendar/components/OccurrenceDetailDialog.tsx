import { Link } from 'react-router'
import { ModalDialog } from '@/components/shared/ModalDialog'
import { Button } from '@/components/ui/button'
import type { CalendarOccurrence } from '@/types/api'
import { cn } from '@/utils/cn'
import { formatLunar, formatSolarWithWeekday } from '@/utils/lunar'
import { EVENT_TYPE_META } from '../eventMeta'
import { occurrenceActions, typeLine } from '../format'
import { calendarStrings } from '../strings'
import { DaysTile } from './DaysTile'

const s = calendarStrings.detail

type OccurrenceDetailDialogProps = {
  /** `null` là đóng. */
  occurrence: CalendarOccurrence | null
  onClose: () => void
  isAdmin?: boolean
  /** Không truyền thì không có nút (khách, tài khoản chưa duyệt, trang Tổng quan). */
  onEdit?: (occurrence: CalendarOccurrence) => void
  onDelete?: (occurrence: CalendarOccurrence) => void
}

/** Chi tiết một sự kiện: số ngày còn lại, tên, loại, ngày dương và âm đầy đủ, ghi chú đầy đủ, hồ sơ, Sửa/Xóa. */
export function OccurrenceDetailDialog({ occurrence: o, onClose, isAdmin, onEdit, onDelete }: OccurrenceDetailDialogProps) {
  const actions =
    o && occurrenceActions(o, { isAdmin, canEdit: onEdit !== undefined, canDelete: onDelete !== undefined })

  return (
    <ModalDialog open={o !== null} title={s.title} onClose={onClose}>
      {o && actions && (
        <>
          <div className="flex items-stretch gap-3">
            <DaysTile daysUntil={o.daysUntil} />
            <div className="flex min-w-0 flex-col justify-center gap-1">
              <p className="text-lg leading-snug font-bold break-words text-text">{o.title}</p>
              <p className="flex items-center gap-1.5 text-sm font-medium text-text">
                <span className={cn('size-2.5 shrink-0 rounded-full', EVENT_TYPE_META[o.type].dot)} aria-hidden="true" />
                {typeLine(o)}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <dt className="text-text-muted">{s.solar}</dt>
            <dd className="text-text">{formatSolarWithWeekday(o.solar)}</dd>
            <dt className="text-text-muted">{s.lunar}</dt>
            <dd className="text-text">{formatLunar(o.lunar)}</dd>
            {o.description && (
              <>
                <dt className="text-text-muted">{s.note}</dt>
                <dd className="break-words whitespace-pre-line text-text">{o.description}</dd>
              </>
            )}
          </dl>

          {(o.memberId !== null || actions.showEdit || actions.showDelete) && (
            <div className="flex flex-wrap gap-2">
              {o.memberId !== null && (
                <Button asChild variant="secondary" className="flex-1">
                  <Link to={`/thanh-vien/${o.memberId}`}>{calendarStrings.occurrence.viewMember}</Link>
                </Button>
              )}
              {actions.showEdit && (
                <Button variant="outline" className="flex-1" aria-label={actions.labels.edit} onClick={() => onEdit!(o)}>
                  {s.edit}
                </Button>
              )}
              {actions.showDelete && (
                <Button variant="danger" className="flex-1" aria-label={actions.labels.delete} onClick={() => onDelete!(o)}>
                  {s.delete}
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </ModalDialog>
  )
}
