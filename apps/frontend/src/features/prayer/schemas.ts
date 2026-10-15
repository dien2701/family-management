import { z } from 'zod'
import { slotError } from './slots'
import { prayerStrings } from './strings'

const s = prayerStrings.form

export const prayerFormSchema = z.object({
  title: z.string().trim().min(1, s.titleRequired).max(200, s.titleMax),
  content: z
    .string()
    .min(1, s.contentRequired)
    .max(20000, s.contentMax)
    .superRefine((value, ctx) => {
      const error = slotError(value)
      if (error) ctx.addIssue({ code: 'custom', message: error })
    }),
})

export type PrayerFormValues = z.infer<typeof prayerFormSchema>

export const PRAYER_FORM_FIELDS = ['title', 'content'] as const
