import type { SolarDate } from './types'

/** JDN của 1970-01-01, để đổi qua lại với số ngày kể từ epoch. */
const EPOCH_JDN = 2_440_588
const MS_PER_DAY = 86_400_000

export const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

export function daysInSolarMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

/** Ngày dương có thật không (tháng 1–12, ngày trong tháng, 29/2 chỉ ở năm nhuận). */
export function isValidSolar({ year, month, day }: SolarDate): boolean {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInSolarMonth(year, month)
  )
}

// Date.UTC coi năm 0–99 là 1900–1999, nên đặt năm bằng setUTCFullYear
function utcMillis({ year, month, day }: SolarDate): number {
  const d = new Date(0)
  d.setUTCFullYear(year, month - 1, day)
  return d.getTime()
}

export function toJdn(date: SolarDate): number {
  return Math.floor(utcMillis(date) / MS_PER_DAY) + EPOCH_JDN
}

export function fromJdn(jdn: number): SolarDate {
  const d = new Date((jdn - EPOCH_JDN) * MS_PER_DAY)
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

/** Thứ trong tuần: 0 = Chủ nhật … 6 = Thứ bảy. */
export function weekday(date: SolarDate): number {
  return new Date(utcMillis(date)).getUTCDay()
}

const pad = (n: number, width: number) => String(n).padStart(width, '0')

/** `yyyy-MM-dd`, cùng dạng với JSON fixture và `LocalDate.toString()` của Java. */
export const toIso = ({ year, month, day }: SolarDate): string =>
  `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`

export function parseIso(iso: string): SolarDate {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) throw new RangeError(`Ngày không đúng dạng yyyy-MM-dd: ${iso}`)
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) }
}

/** `dd/MM/yyyy` theo DESIGN §7. */
export const formatSolar = ({ year, month, day }: SolarDate): string =>
  `${pad(day, 2)}/${pad(month, 2)}/${pad(year, 4)}`

// en-CA cho ra yyyy-MM-dd; ép múi giờ +7 để "hôm nay" đúng với người dùng dù máy đặt múi giờ nào
const VN_TODAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })

/** Ngày hôm nay theo giờ Việt Nam. */
export const todayInVietnam = (): SolarDate => parseIso(VN_TODAY.format(new Date()))
