import { z } from 'zod'
import type { MemberDetail, MemberInput } from '@/types/api'
import {
  emptyDualDate,
  resolveDualDate,
  type DualDateOptions,
  type DualDateValue,
} from '@/utils/lunar'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^[0-9+().\s-]*$/

/** Ngày sinh được phép chỉ có năm; ngày mất được phép chỉ có ngày/tháng âm (DualDateInput, IDEA §6.1). */
export const BIRTH_OPTIONS: DualDateOptions = { allowYearOnly: true }
export const DEATH_OPTIONS: DualDateOptions = { allowNoYear: true }

const dualDateSchema = z.object({
  calendar: z.enum(['solar', 'lunar']),
  day: z.string(),
  month: z.string(),
  year: z.string(),
  leap: z.boolean(),
})

// Nhóm "đã mất" tách riêng để Đợt 13 khóa lại khi User tự sửa hồ sơ (DECISIONS #76)
const deathShape = {
  isDeceased: z.boolean(),
  deathDate: dualDateSchema,
  memorialDay: z.string().trim(),
  memorialMonth: z.string().trim(),
  burialPlace: z.string().trim().max(300, 'Nơi an táng tối đa 300 ký tự.'),
}

const basicShape = {
  fullName: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập họ tên.')
    .max(200, 'Họ tên tối đa 200 ký tự.'),
  tabooName: z.string().trim().max(200, 'Tên húy tối đa 200 ký tự.'),
  gender: z.enum(['', 'M', 'F']),
  labels: z.string().trim().max(1000, 'Nhãn quá dài.'),
  birth: dualDateSchema,
  phone: z
    .string()
    .trim()
    .max(30, 'Số điện thoại tối đa 30 ký tự.')
    .regex(PHONE, 'Số điện thoại chỉ gồm chữ số và các ký tự + ( ) . -'),
  email: z
    .string()
    .trim()
    .max(254, 'Email tối đa 254 ký tự.')
    .refine((v) => !v || EMAIL.test(v), 'Email không hợp lệ.'),
  biography: z.string().trim().max(5000, 'Tiểu sử tối đa 5000 ký tự.'),
}

export const memberFormSchema = z
  .object({ ...basicShape, ...deathShape })
  .superRefine((v, ctx) => {
    const birth = resolveDualDate(v.birth, BIRTH_OPTIONS)
    if (birth.status === 'invalid' || birth.status === 'incomplete') {
      ctx.addIssue({ code: 'custom', path: ['birth'], message: birth.message })
    }

    if (!v.isDeceased) return
    const death = resolveDualDate(v.deathDate, DEATH_OPTIONS)
    if (death.status === 'invalid' || death.status === 'incomplete') {
      ctx.addIssue({ code: 'custom', path: ['deathDate'], message: death.message })
    }

    const { memorialDay: day, memorialMonth: month } = v
    if (day || month) {
      const d = Number(day)
      const m = Number(month)
      if (!day || !month) {
        const path = day ? 'memorialMonth' : 'memorialDay'
        ctx.addIssue({ code: 'custom', path: [path], message: 'Nhập đủ cả ngày và tháng giỗ.' })
      } else if (!Number.isInteger(d) || d < 1 || d > 30) {
        ctx.addIssue({ code: 'custom', path: ['memorialDay'], message: 'Ngày giỗ từ 1 đến 30.' })
      } else if (!Number.isInteger(m) || m < 1 || m > 12) {
        ctx.addIssue({ code: 'custom', path: ['memorialMonth'], message: 'Tháng giỗ từ 1 đến 12.' })
      }
    }
  })

export type MemberFormValues = z.infer<typeof memberFormSchema>

/** Tên các trường của form, dùng để gán lỗi của ProblemDetail vào đúng trường. */
export const MEMBER_FORM_FIELDS = [
  'fullName',
  'tabooName',
  'gender',
  'labels',
  'birth',
  'phone',
  'email',
  'biography',
  'isDeceased',
  'burialPlace',
] as const

export const emptyMemberFormValues = (): MemberFormValues => ({
  fullName: '',
  tabooName: '',
  gender: '',
  labels: '',
  birth: emptyDualDate('solar'),
  phone: '',
  email: '',
  biography: '',
  isDeceased: false,
  // Ngày giỗ thường nhập theo âm lịch
  deathDate: emptyDualDate('lunar'),
  memorialDay: '',
  memorialMonth: '',
  burialPlace: '',
})

const text = (n: number | null | undefined) => (n == null ? '' : String(n))

function birthToDual(birth: MemberDetail['birth']): DualDateValue {
  if (!birth) return emptyDualDate('solar')
  const lunar = birth.calendar === 'LUNAR'
  return {
    calendar: lunar ? 'lunar' : 'solar',
    day: text(birth.day),
    month: text(birth.month),
    year: text(birth.year),
    leap: lunar && birth.leap === true,
  }
}

/** Ngày mất nhập theo âm nếu có (nguồn nhập của dữ liệu gốc), không thì theo dương. */
function deathToDual(member: MemberDetail): DualDateValue {
  const { deathLunar, deathSolar } = member
  if (deathLunar) {
    return {
      calendar: 'lunar',
      day: text(deathLunar.day),
      month: text(deathLunar.month),
      year: text(deathLunar.year),
      leap: deathLunar.leap,
    }
  }
  if (deathSolar) {
    return {
      calendar: 'solar',
      day: text(deathSolar.day),
      month: text(deathSolar.month),
      year: text(deathSolar.year),
      leap: false,
    }
  }
  return emptyDualDate('lunar')
}

export function memberToFormValues(member: MemberDetail): MemberFormValues {
  return {
    fullName: member.fullName,
    tabooName: member.tabooName ?? '',
    gender: member.gender ?? '',
    labels: member.labels.join(', '),
    birth: birthToDual(member.birth),
    phone: member.phone ?? '',
    email: member.email ?? '',
    biography: member.biography ?? '',
    isDeceased: member.isDeceased,
    deathDate: deathToDual(member),
    memorialDay: text(member.memorialOverride?.day),
    memorialMonth: text(member.memorialOverride?.month),
    burialPlace: member.burialPlace ?? '',
  }
}

const orNull = (s: string) => s.trim() || null

function birthToInput(value: DualDateValue): MemberInput['birth'] {
  const result = resolveDualDate(value, BIRTH_OPTIONS)
  const calendar = value.calendar === 'lunar' ? 'LUNAR' : 'SOLAR'
  if (result.status === 'yearOnly') {
    return { year: result.year, month: null, day: null, calendar, leap: false }
  }
  if (result.status === 'full') {
    const d = value.calendar === 'lunar' ? result.lunar : result.solar
    return { year: d.year, month: d.month, day: d.day, calendar, leap: value.leap }
  }
  return null
}

/** Nhập ở lịch nào thì gửi đúng lịch đó; máy chủ tự tính lịch còn lại khi có năm. */
function deathToInput(value: DualDateValue): Pick<MemberInput, 'deathSolar' | 'deathLunar'> {
  const result = resolveDualDate(value, DEATH_OPTIONS)
  if (result.status === 'full') {
    return value.calendar === 'solar'
      ? { deathSolar: result.solar, deathLunar: null }
      : { deathSolar: null, deathLunar: { ...result.lunar } }
  }
  if (result.status === 'lunarMonthDay') {
    return { deathSolar: null, deathLunar: { ...result.monthDay, year: null } }
  }
  return { deathSolar: null, deathLunar: null }
}

/** Giá trị form (đã qua kiểm tra) → body của POST/PUT /api/members. */
export function formValuesToInput(v: MemberFormValues): MemberInput {
  const base: MemberInput = {
    fullName: v.fullName.trim(),
    gender: v.gender === '' ? null : v.gender,
    tabooName: orNull(v.tabooName),
    labels: v.labels
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean),
    biography: orNull(v.biography),
    phone: orNull(v.phone),
    email: orNull(v.email),
    birth: birthToInput(v.birth),
    isDeceased: v.isDeceased,
    deathSolar: null,
    deathLunar: null,
    memorialOverride: null,
    burialPlace: null,
  }
  if (!v.isDeceased) return base
  return {
    ...base,
    ...deathToInput(v.deathDate),
    memorialOverride:
      v.memorialDay && v.memorialMonth
        ? { day: Number(v.memorialDay), month: Number(v.memorialMonth) }
        : null,
    burialPlace: orNull(v.burialPlace),
  }
}
