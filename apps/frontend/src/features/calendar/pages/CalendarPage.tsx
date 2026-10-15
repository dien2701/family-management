import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { isApproved } from '@/features/auth/routing'
import { useAuth } from '@/hooks/useAuth'
import type { CalendarOccurrence } from '@/types/api'
import type { DualDateValue } from '@/utils/lunar'
import { EventFormDialog, prefillDate } from '../components/EventFormDialog'
import { MemberDateDialog } from '../components/MemberDateDialog'
import { MonthTab } from '../components/MonthTab'
import { OccurrenceDeleteDialog } from '../components/OccurrenceDeleteDialog'
import { UpcomingTab } from '../components/UpcomingTab'
import { calendarStrings } from '../strings'

const s = calendarStrings.page

type Tab = 'sap-toi' | 'thang'
const TABS: { value: Tab; label: string }[] = [
  { value: 'sap-toi', label: s.upcoming },
  { value: 'thang', label: s.month },
]

type FormState = { open: boolean; eventId: number | null; initialDate?: DualDateValue }
type MemberDateState = { open: boolean; memberId: number | null; kind: 'MEMORIAL' | 'BIRTHDAY' }

/**
 * Trang Lịch: tab "Sắp tới" và "Lịch tháng". Ai cũng xem được, kể cả khách (DECISIONS #88). Admin thêm, sửa, xóa
 * sự kiện chung; User đã duyệt gửi đề xuất; khách và tài khoản chưa duyệt không có nút nào.
 */
export function CalendarPage() {
  const { user } = useAuth()
  const isAdmin = user?.systemRole === 'ADMIN'
  const canWrite = isApproved(user)
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'thang' ? 'thang' : 'sap-toi'
  const [form, setForm] = useState<FormState>({ open: false, eventId: null })

  const openCreate = (initialDate?: DualDateValue) => setForm({ open: true, eventId: null, initialDate })
  const [memberDate, setMemberDate] = useState<MemberDateState>({ open: false, memberId: null, kind: 'MEMORIAL' })
  const [deleting, setDeleting] = useState<CalendarOccurrence | null>(null)

  // Sự kiện chung mở form sự kiện; giỗ và sinh nhật (chỉ Admin) mở form ngày trong hồ sơ
  const openEdit = (o: CalendarOccurrence) => {
    if (o.eventId !== null) setForm({ open: true, eventId: o.eventId })
    else if (o.memberId !== null)
      setMemberDate({ open: true, memberId: o.memberId, kind: o.type === 'BIRTHDAY' ? 'BIRTHDAY' : 'MEMORIAL' })
  }
  const closeForm = () => setForm((f) => ({ ...f, open: false }))

  const selectTab = (value: Tab) => {
    const next = new URLSearchParams(params)
    if (value === 'sap-toi') next.delete('tab')
    else next.set('tab', value)
    setParams(next, { replace: true })
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label={s.tabsLabel}
          className="grid grid-cols-2 gap-1 rounded-field bg-secondary p-1 sm:min-w-72"
        >
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="tab"
              id={`calendar-tab-${value}`}
              aria-selected={tab === value}
              aria-controls="calendar-panel"
              onClick={() => selectTab(value)}
              className="min-h-11 cursor-pointer rounded-button px-4 text-base font-semibold text-secondary-fg transition-colors duration-200 ease-out aria-selected:bg-primary aria-selected:text-primary-fg"
            >
              {label}
            </button>
          ))}
        </div>
        {canWrite && (
          <Button onClick={() => openCreate()}>
            <Plus aria-hidden="true" />
            {isAdmin ? s.addEvent : s.proposeEvent}
          </Button>
        )}
      </div>

      <div role="tabpanel" id="calendar-panel" aria-labelledby={`calendar-tab-${tab}`}>
        {tab === 'sap-toi' ? (
          <UpcomingTab isAdmin={isAdmin} onEdit={openEdit} onDelete={setDeleting} />
        ) : (
          <MonthTab
            isAdmin={isAdmin}
            onEdit={openEdit}
            onDelete={setDeleting}
            onAdd={
              canWrite
                ? (day, mode) => openCreate(prefillDate(mode, mode === 'lunar' ? day.lunar : day.solar))
                : undefined
            }
          />
        )}
      </div>

      {canWrite && (
        <EventFormDialog
          open={form.open}
          eventId={form.eventId}
          initialDate={form.initialDate}
          mode={isAdmin ? 'direct' : 'proposal'}
          onClose={closeForm}
        />
      )}
      {isAdmin && (
        <>
          <MemberDateDialog
            open={memberDate.open}
            memberId={memberDate.memberId}
            kind={memberDate.kind}
            onClose={() => setMemberDate((m) => ({ ...m, open: false }))}
          />
          <OccurrenceDeleteDialog occurrence={deleting} onClose={() => setDeleting(null)} />
        </>
      )}
    </div>
  )
}
