import { z } from 'zod'
import type { CustomEvent, CustomEventInput } from '@/types/api'
import { emptyDualDate, resolveDualDate, type DualDateOptions, type DualDateValue } from '@/utils/lunar'
import { calendarStrings } from './strings'

const s = calendarStrings.form

export type Repeat = 'yearly' | 'once'

/** Lặp hằng năm: chỉ ngày/tháng (âm hoặc dương). Một lần: đủ ngày, tháng, năm. */
export const dateOptions = (repeat: Repeat): DualDateOptions =>
  repeat === 'yearly' ? { allowNoYear: true, allowNoYearSolar: true } : {}

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, s.titleRequired).max(200, s.titleTooLong),
    description: z.string().trim().max(2000, s.descriptionTooLong),
    repeat: z.enum(['yearly', 'once']),
    date: z.object({
      calendar: z.enum(['solar', 'lunar']),
      day: z.string(),
      month: z.string(),
      year: z.string(),
      leap: z.boolean(),
    }),
  })
  .superRefine((v, ctx) => {
    const result = resolveDualDate(v.date, dateOptions(v.repeat))
    const fail = (message: string) => ctx.addIssue({ code: 'custom', path: ['date'], message })
    if (result.status === 'invalid' || result.status === 'incomplete') fail(result.message)
    else if (result.status === 'empty') fail('Vui lòng nhập ngày diễn ra.')
    else if (v.repeat === 'yearly' && result.status === 'full') {
      fail('Sự kiện lặp hằng năm không có năm. Hãy để trống ô năm hoặc chọn “Chỉ một lần”.')
    } else if (result.status === 'yearOnly') fail('Nhập cả ngày và tháng.')
  })

export type EventFormValues = z.infer<typeof eventFormSchema>

/** Tên trường của form; lỗi `day/month/year/leap/calendar` của máy chủ đều hiện dưới ô ngày. */
export const EVENT_FORM_FIELDS = ['title', 'description'] as const
export const EVENT_DATE_FIELDS: readonly string[] = ['day', 'month', 'year', 'leap', 'calendar']

export const emptyEventFormValues = (date?: DualDateValue): EventFormValues => ({
  title: '',
  description: '',
  repeat: 'yearly',
  date: date ?? emptyDualDate('lunar'),
})

const text = (n: number | null) => (n === null ? '' : String(n))

export function eventToFormValues(e: CustomEvent): EventFormValues {
  const lunar = e.calendar === 'LUNAR'
  return {
    title: e.title,
    description: e.description ?? '',
    repeat: e.year === null ? 'yearly' : 'once',
    date: {
      calendar: lunar ? 'lunar' : 'solar',
      day: String(e.day),
      month: String(e.month),
      year: text(e.year),
      leap: lunar && e.leap,
    },
  }
}

/** Giá trị form (đã qua kiểm tra) → body của POST/PUT /api/events. Nhập ở lịch nào gửi đúng lịch đó. */
export function formValuesToInput(v: EventFormValues): CustomEventInput {
  const calendar = v.date.calendar === 'lunar' ? 'LUNAR' : 'SOLAR'
  return {
    title: v.title.trim(),
    description: v.description.trim() || null,
    calendar,
    day: Number(v.date.day),
    month: Number(v.date.month),
    year: v.repeat === 'yearly' ? null : Number(v.date.year),
    leap: calendar === 'LUNAR' && v.date.leap,
  }
}
