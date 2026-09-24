import { describe, expect, it } from 'vitest'
import { fixtureSamples, fixtureYears } from './fixtures'
import {
  MAX_YEAR,
  MIN_LUNAR_YEAR,
  daysInMonth,
  firstDayOfMonth,
  isValid,
  leapMonth,
  newYear,
  toLunar,
  toSolar,
} from './lunarCalendar'
import { toIso, toJdn } from './solarDate'
import type { SolarDate } from './types'

const solar = (year: number, month: number, day: number): SolarDate => ({ year, month, day })
const lunar = (year: number, month: number, day: number, leap = false) => ({
  year,
  month,
  day,
  leap,
})

// Đối chiếu với bảng của Hồ Ngọc Đức cho toàn bộ năm âm 1899–2100 (mọi ngày dương 1900–2100), giống LunarCalendarTest
describe('LunarCalendar so với fixture dùng chung', () => {
  it('có đủ 202 năm âm 1899–2100', () => {
    expect(fixtureYears).toHaveLength(202)
    expect(fixtureYears[0]?.year).toBe(MIN_LUNAR_YEAR)
    expect(fixtureYears.at(-1)?.year).toBe(MAX_YEAR)
  })

  it('Tết và tháng nhuận khớp ở mọi năm', () => {
    const mismatches: string[] = []
    for (const y of fixtureYears) {
      if (toIso(newYear(y.year)) !== toIso(y.tet)) {
        mismatches.push(`${y.year} Tết ${toIso(newYear(y.year))} ≠ ${toIso(y.tet)}`)
      }
      if (leapMonth(y.year) !== y.leapMonth) {
        mismatches.push(`${y.year} nhuận ${leapMonth(y.year)} ≠ ${y.leapMonth}`)
      }
    }
    expect(mismatches).toEqual([])
  })

  it('ngày đầu và độ dài của mọi tháng khớp', () => {
    const mismatches: string[] = []
    for (const y of fixtureYears) {
      for (const m of y.months) {
        const start = toIso(firstDayOfMonth(y.year, m.month, m.leap))
        const days = daysInMonth(y.year, m.month, m.leap)
        if (start !== toIso(m.start) || days !== m.days) {
          mismatches.push(
            `${y.year}/${m.month}${m.leap ? 'N' : ''}: ${start} (${days}) ≠ ${toIso(m.start)} (${m.days})`,
          )
        }
      }
    }
    expect(mismatches).toEqual([])
  })

  it('mọi ngày dương 1900–2100 đổi hai chiều đúng như fixture', () => {
    const mismatches: string[] = []
    let checked = 0
    for (const y of fixtureYears) {
      for (const m of y.months) {
        for (let d = 1; d <= m.days; d++) {
          const date = solarPlusDays(m.start, d - 1)
          if (date.year < 1900 || date.year > MAX_YEAR) continue
          const expected = lunar(y.year, m.month, d, m.leap)
          const got = toLunar(date)
          if (JSON.stringify(got) !== JSON.stringify(expected)) {
            mismatches.push(`${toIso(date)} → ${JSON.stringify(got)} ≠ ${JSON.stringify(expected)}`)
          }
          const back = toSolar(expected)
          if (toIso(back) !== toIso(date)) {
            mismatches.push(`${JSON.stringify(expected)} → ${toIso(back)} ≠ ${toIso(date)}`)
          }
          checked++
        }
      }
    }
    expect(mismatches).toEqual([])
    // Phủ kín mọi ngày từ 01/01/1900 tới 31/12/2100
    expect(checked).toBe(toJdn(solar(2101, 1, 1)) - toJdn(solar(1900, 1, 1)))
  })

  it('các mốc tra tay khớp', () => {
    for (const s of fixtureSamples) {
      expect(toLunar(s.solar), s.note).toEqual(s.lunar)
      expect(toSolar(s.lunar), s.note).toEqual(s.solar)
    }
  })
})

function solarPlusDays(start: SolarDate, days: number): SolarDate {
  const date = new Date(0)
  date.setUTCFullYear(start.year, start.month - 1, start.day + days)
  return solar(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

describe('LunarCalendar: mốc bắt buộc', () => {
  it('Tết 1985 là 21/01/1985 (lịch Việt Nam, khác Trung Quốc)', () => {
    expect(newYear(1985)).toEqual(solar(1985, 1, 21))
    expect(toLunar(solar(1985, 1, 21))).toEqual(lunar(1985, 1, 1))
  })

  it.each([
    [solar(2026, 2, 17), 2026],
    [solar(2025, 1, 29), 2025],
    [solar(1968, 1, 29), 1968],
    [solar(2030, 2, 2), 2030],
  ])('mùng 1 Tết %o là năm âm %i', (date, year) => {
    expect(toLunar(date)).toEqual(lunar(year, 1, 1))
  })

  it.each([
    [2020, 4],
    [2023, 2],
    [2025, 6],
  ])('năm %i nhuận tháng %i', (year, month) => {
    expect(leapMonth(year)).toBe(month)
  })

  it('năm không nhuận trả 0', () => {
    expect(leapMonth(2024)).toBe(0)
    expect(leapMonth(2026)).toBe(0)
  })

  it('15/6 nhuận 2025 đổi hai chiều, cách tháng thường đúng một tháng', () => {
    const leap = lunar(2025, 6, 15, true)
    expect(toSolar(leap)).toEqual(solar(2025, 8, 8))
    expect(toLunar(solar(2025, 8, 8))).toEqual(leap)
    expect(toSolar(lunar(2025, 6, 15))).toEqual(solar(2025, 7, 9))
  })

  it('năm đổi múi giờ 1968 liền mạch: tháng Chạp 1967 chỉ 29 ngày', () => {
    expect(toLunar(solar(1968, 1, 28))).toEqual(lunar(1967, 12, 29))
    expect(daysInMonth(1967, 12, false)).toBe(29)
  })

  it('hiệu chỉnh ngày sóc: 07/05/2054 là mùng 1 tháng 4, không phải "ngày 0"', () => {
    expect(toLunar(solar(2054, 5, 7))).toEqual(lunar(2054, 4, 1))
  })
})

describe('LunarCalendar: đầu vào sai', () => {
  it('từ chối cờ nhuận cho tháng không nhuận', () => {
    expect(isValid(lunar(2025, 5, 1, true))).toBe(false)
    expect(() => toSolar(lunar(2025, 5, 1, true))).toThrow()
  })

  it('từ chối ngày 30 của tháng thiếu', () => {
    expect(daysInMonth(2025, 12, false)).toBe(29)
    expect(isValid(lunar(2025, 12, 30))).toBe(false)
    expect(() => toSolar(lunar(2025, 12, 30))).toThrow()
    expect(isValid(lunar(2025, 11, 30))).toBe(true)
  })

  it('từ chối năm ngoài khoảng đã đối chiếu', () => {
    expect(() => toLunar(solar(1899, 12, 31))).toThrow()
    expect(() => toLunar(solar(2101, 1, 1))).toThrow()
    expect(() => leapMonth(1898)).toThrow()
    expect(isValid(lunar(2101, 1, 1))).toBe(false)
    expect(toLunar(solar(1900, 1, 1)).year).toBe(1899)
  })
})
