import type { SolarDate } from '@/utils/lunar'

export type OccurrenceType = 'MEMORIAL' | 'BIRTHDAY' | 'CUSTOM'

/** Phần hồ sơ thành viên đủ để sinh giỗ và sinh nhật (khớp về cấu trúc với `MemberDetail`). */
export type OccurrenceMember = {
  id: number
  fullName: string
  isDeceased: boolean
  birth: {
    year?: number | null
    month?: number | null
    day?: number | null
    calendar: 'SOLAR' | 'LUNAR'
    leap?: boolean
  } | null
  deathSolar: SolarDate | null
  deathLunar: { day: number; month: number; leap: boolean; year?: number | null } | null
  memorialOverride: { day: number; month: number } | null
}

/** Sự kiện chung (khớp về cấu trúc với `CustomEvent`). `year = null` là lặp hằng năm. */
export type OccurrenceEvent = {
  id: number
  title: string
  description: string | null
  calendar: 'SOLAR' | 'LUNAR'
  day: number
  month: number
  year: number | null
  leap: boolean
}

export type OccurrenceSources = {
  members: readonly OccurrenceMember[]
  events: readonly OccurrenceEvent[]
}

export type OccurrenceLunar = { year: number; month: number; day: number; leap: boolean }

/** Một lần xảy ra. `ordinal` là "giỗ lần thứ N" hoặc "tròn N tuổi", `null` khi không biết năm. */
export type Occurrence = {
  /** Ổn định: `{TYPE}:{id}:{yyyy-MM-dd}` với id là thành viên (giỗ, sinh nhật) hoặc sự kiện (chung). */
  eventKey: string
  type: OccurrenceType
  title: string
  description: string | null
  memberId: number | null
  eventId: number | null
  solar: SolarDate
  lunar: OccurrenceLunar
  ordinal: number | null
}
