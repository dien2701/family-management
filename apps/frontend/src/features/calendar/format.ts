import type { CalendarOccurrence } from '@/types/api'
import { formatLunarDayMonth, formatSolar, formatSolarWithWeekday, type SolarDate } from '@/utils/lunar'
import { EVENT_TYPE_META } from './eventMeta'
import { calendarStrings } from './strings'

const s = calendarStrings.occurrence

/** "Hôm nay", "Ngày mai", "còn 12 ngày", "3 ngày trước". */
export function daysLabel(daysUntil: number): string {
  if (daysUntil === 0) return s.today
  if (daysUntil === 1) return s.tomorrow
  return daysUntil > 0 ? s.inDays(daysUntil) : s.agoDays(-daysUntil)
}

/** "giỗ lần thứ 5" hoặc "tròn 70 tuổi"; không có khi không biết năm. */
export function ordinalLabel(o: Pick<CalendarOccurrence, 'type' | 'ordinal'>): string | null {
  if (o.ordinal === null) return null
  if (o.type === 'MEMORIAL') return s.memorialNth(o.ordinal)
  if (o.type === 'BIRTHDAY') return s.birthdayAge(o.ordinal)
  return null
}

/** "Thứ ba, 17/02/2026 · 11/7 âm" */
export function occurrenceDateLine(o: Pick<CalendarOccurrence, 'solar' | 'lunar'>): string {
  return `${formatSolarWithWeekday(o.solar)} · ${formatLunarDayMonth(o.lunar)}`
}

/** "17/02" cho tiêu đề tuần. */
export const shortSolar = (d: SolarDate): string => formatSolar(d).slice(0, 5)

/** "22/09/2026 dương · 12/8 âm": ghi rõ cả hai lịch, dùng ở dashboard. */
export function dualDateLine(o: Pick<CalendarOccurrence, 'solar' | 'lunar'>): string {
  return `${formatSolar(o.solar)} dương · ${formatLunarDayMonth(o.lunar)}`
}

/** Dòng loại luôn có chữ: "Giỗ lần thứ 5", "Tròn 70 tuổi", hoặc tên loại khi không biết năm. */
export function typeLine(o: Pick<CalendarOccurrence, 'type' | 'ordinal'>): string {
  const ordinal = ordinalLabel(o)
  return ordinal ? ordinal.charAt(0).toUpperCase() + ordinal.slice(1) : EVENT_TYPE_META[o.type].label
}

/**
 * Nút nào được hiện. Sự kiện chung: ai được truyền `canEdit` thì Sửa (User gửi đề xuất). Giỗ và sinh nhật: chỉ Admin.
 * Xóa: chỉ Admin.
 */
export function occurrenceActions(
  o: Pick<CalendarOccurrence, 'type' | 'eventId' | 'memberId'>,
  { isAdmin, canEdit, canDelete }: { isAdmin?: boolean; canEdit: boolean; canDelete: boolean },
) {
  const custom = o.eventId !== null
  const editable = custom || (isAdmin === true && o.memberId !== null)
  const labels = custom
    ? { edit: s.edit, delete: s.delete }
    : o.type === 'BIRTHDAY'
      ? { edit: s.editBirthday, delete: s.deleteBirthday }
      : { edit: s.editMemorial, delete: s.deleteMemorial }
  return {
    showEdit: canEdit && editable,
    showDelete: canDelete && isAdmin === true && editable,
    labels,
  }
}
