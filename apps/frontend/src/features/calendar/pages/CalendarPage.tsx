import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import type { DualDateValue } from '@/utils/lunar'
import { EventFormDialog, prefillDate } from '../components/EventFormDialog'
import { MonthTab } from '../components/MonthTab'
import { UpcomingTab } from '../components/UpcomingTab'
import { calendarStrings } from '../strings'

const s = calendarStrings.page

type Tab = 'sap-toi' | 'thang'
const TABS: { value: Tab; label: string }[] = [
  { value: 'sap-toi', label: s.upcoming },
  { value: 'thang', label: s.month },
]

type FormState = { open: boolean; eventId: number | null; initialDate?: DualDateValue }

/** Trang Lịch: tab "Sắp tới" và "Lịch tháng". Admin thêm, sửa, xóa sự kiện chung; mọi tài khoản đã duyệt được xem. */
export function CalendarPage() {
  const isAdmin = useAuth().user?.systemRole === 'ADMIN'
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'thang' ? 'thang' : 'sap-toi'
  const [form, setForm] = useState<FormState>({ open: false, eventId: null })

  const openCreate = (initialDate?: DualDateValue) => setForm({ open: true, eventId: null, initialDate })
  const openEdit = (eventId: number) => setForm({ open: true, eventId })
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
        <Button onClick={() => openCreate()}>
          <Plus aria-hidden="true" />
          {isAdmin ? s.addEvent : s.proposeCreateTitle || 'Đề xuất sự kiện'}
        </Button>
      </div>

      <div role="tabpanel" id="calendar-panel" aria-labelledby={`calendar-tab-${tab}`}>
        {tab === 'sap-toi' ? (
          <UpcomingTab isAdmin={isAdmin} onEdit={openEdit} />
        ) : (
          <MonthTab
            isAdmin={isAdmin}
            onEdit={openEdit}
            onAdd={(day, mode) =>
              openCreate(prefillDate(mode, mode === 'lunar' ? day.lunar : day.solar))
            }
          />
        )}
      </div>

      <EventFormDialog
        open={form.open}
        eventId={form.eventId}
        initialDate={form.initialDate}
        mode={isAdmin ? 'direct' : 'proposal'}
        onClose={closeForm}
      />
    </div>
  )
}
