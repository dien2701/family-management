import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ApiError } from '@/services/client'
import type { CalendarOccurrence } from '@/types/api'
import { emptyDualDate } from '@/utils/lunar'
import { useDeleteEvent, usePatchMemberDates } from '../hooks'
import { calendarStrings } from '../strings'

const form = calendarStrings.form
const md = calendarStrings.memberDate

type OccurrenceDeleteDialogProps = {
  /** `null` là đóng. */
  occurrence: CalendarOccurrence | null
  onClose: () => void
}

/**
 * Admin xóa một mục trên Lịch. Sự kiện chung thì xóa hẳn; giỗ và sinh nhật thì xóa ngày tương ứng trong hồ sơ
 * (thành viên vẫn còn, vẫn ghi là đã mất).
 */
export function OccurrenceDeleteDialog({ occurrence: o, onClose }: OccurrenceDeleteDialogProps) {
  const removeEvent = useDeleteEvent()
  const patch = usePatchMemberDates()
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    setError(null)
    onClose()
  }

  const confirm = async () => {
    if (!o) return
    setError(null)
    try {
      if (o.eventId !== null) {
        await removeEvent.mutateAsync(o.eventId)
      } else if (o.memberId !== null) {
        await patch.mutateAsync({
          memberId: o.memberId,
          patch:
            o.type === 'BIRTHDAY'
              ? { birth: emptyDualDate('solar') }
              : { deathDate: emptyDualDate('lunar'), memorialDay: '', memorialMonth: '' },
        })
      }
      close()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : form.deleteFailed)
    }
  }

  const memorial = o?.type === 'MEMORIAL'
  const custom = o?.eventId !== null
  return (
    <ConfirmDialog
      open={o !== null}
      title={custom ? form.deleteConfirmTitle : memorial ? md.deleteMemorialTitle : md.deleteBirthdayTitle}
      description={
        o
          ? custom
            ? form.deleteConfirmBody(o.title)
            : memorial
              ? md.deleteMemorialBody(o.title)
              : md.deleteBirthdayBody(o.title)
          : ''
      }
      confirmLabel={form.deleteConfirm}
      cancelLabel={form.cancel}
      danger
      loading={removeEvent.isPending || patch.isPending}
      error={error}
      onConfirm={() => void confirm()}
      onCancel={close}
    />
  )
}
