import { Plus } from 'lucide-react'
import { ModalDialog } from '@/components/shared/ModalDialog'
import { Button } from '@/components/ui/button'
import type { CalendarDay } from '@/types/api'
import { formatLunar, formatSolarWithWeekday } from '@/utils/lunar'
import { calendarStrings } from '../strings'
import { OccurrenceRow } from './OccurrenceRow'

const s = calendarStrings.day

type DaySheetProps = {
  /** `null` là đóng. */
  day: CalendarDay | null
  isAdmin: boolean
  onEdit: (eventId: number) => void
  /** Không truyền thì không có nút thêm (khách và tài khoản chưa duyệt chỉ xem). */
  onAdd?: (day: CalendarDay) => void
  onClose: () => void
}

/** Danh sách sự kiện của một ngày: bottom sheet trên điện thoại, modal từ 768px (DESIGN §6). */
export function DaySheet({ day, isAdmin, onEdit, onAdd, onClose }: DaySheetProps) {
  return (
    <ModalDialog
      open={day !== null}
      title={day ? formatSolarWithWeekday(day.solar) : ''}
      onClose={onClose}
    >
      {day && (
        <>
          <p className="-mt-2 text-text-muted">{formatLunar(day.lunar)}</p>
          {day.occurrences.length === 0 ? (
            <p className="text-text-muted">{s.empty}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {day.occurrences.map((o) => (
                <OccurrenceRow
                  key={o.eventKey}
                  occurrence={o}
                  hideDate
                  onEdit={onEdit}
                />
              ))}
            </ul>
          )}
          {onAdd && (
            <Button variant="secondary" onClick={() => onAdd(day)}>
              <Plus aria-hidden="true" />
              {isAdmin ? s.addHere : 'Đề xuất sự kiện vào ngày này'}
            </Button>
          )}
        </>
      )}
    </ModalDialog>
  )
}
