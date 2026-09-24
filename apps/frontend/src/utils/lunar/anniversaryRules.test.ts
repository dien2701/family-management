import { describe, expect, it } from 'vitest'
import { lunarOccurrence, lunarOccurrenceSolar, solarOccurrence } from './anniversaryRules'
import { daysInMonth, leapMonth } from './lunarCalendar'

// Các nhánh của AnniversaryRules, cùng dữ liệu với AnniversaryRulesTest bản Java: 2024 tháng 6 thiếu (29 ngày),
// 2026 tháng 6 đủ (30 ngày) và tháng 8 thiếu, 2025 nhuận tháng 6.
const md = (month: number, day: number, leap = false) => ({ month, day, leap })
const ld = (year: number, month: number, day: number) => ({ year, month, day, leap: false })

describe('lunarOccurrence', () => {
  it('giữ nguyên ngày thường', () => {
    expect(lunarOccurrence(2026, md(3, 10), null)).toEqual(ld(2026, 3, 10))
  })

  describe('ưu tiên 1: ngày ghi đè', () => {
    it('ngày ghi đè thắng ngày gốc', () => {
      expect(lunarOccurrence(2026, md(3, 10), md(3, 9))).toEqual(ld(2026, 3, 9))
    })

    it('ghi đè thắng cả khi ngày gốc thuộc tháng nhuận', () => {
      expect(lunarOccurrence(2025, md(6, 15, true), md(6, 14))).toEqual(ld(2025, 6, 14))
    })

    it('ghi đè ngày 30 vẫn lùi về 29 ở tháng thiếu', () => {
      expect(daysInMonth(2026, 8, false)).toBe(29)
      expect(lunarOccurrence(2026, md(8, 1), md(8, 30))).toEqual(ld(2026, 8, 29))
    })
  })

  describe('ưu tiên 2: tháng nhuận cúng tháng thường', () => {
    it('ngày của tháng nhuận cúng vào tháng thường cùng số', () => {
      expect(lunarOccurrence(2026, md(6, 15, true), null)).toEqual(ld(2026, 6, 15))
      expect(lunarOccurrenceSolar(2026, md(6, 15, true), null)).toEqual({
        year: 2026,
        month: 7,
        day: 28,
      })
    })

    it('vẫn cúng tháng thường khi năm đó cũng nhuận đúng tháng ấy', () => {
      expect(leapMonth(2025)).toBe(6)
      expect(lunarOccurrenceSolar(2025, md(6, 15, true), null)).toEqual({
        year: 2025,
        month: 7,
        day: 9,
      })
    })
  })

  describe('ưu tiên 3: ngày 30 cúng 29', () => {
    it('tháng thiếu thì cúng ngày 29', () => {
      expect(daysInMonth(2024, 6, false)).toBe(29)
      expect(lunarOccurrence(2024, md(6, 30), null)).toEqual(ld(2024, 6, 29))
      expect(lunarOccurrenceSolar(2024, md(6, 30), null)).toEqual({ year: 2024, month: 8, day: 3 })
    })

    it('tháng đủ thì giữ ngày 30', () => {
      expect(daysInMonth(2026, 6, false)).toBe(30)
      expect(lunarOccurrenceSolar(2026, md(6, 30), null)).toEqual({ year: 2026, month: 8, day: 12 })
    })

    it('kết hợp với tháng nhuận', () => {
      expect(lunarOccurrence(2024, md(6, 30, true), null)).toEqual(ld(2024, 6, 29))
    })
  })

  it('từ chối tháng/ngày không thể có', () => {
    expect(() => lunarOccurrence(2026, md(13, 1), null)).toThrow()
    expect(() => lunarOccurrence(2026, md(1, 31), null)).toThrow()
  })
})

describe('solarOccurrence', () => {
  it('29/2 năm không nhuận dời sang 28/2', () => {
    expect(solarOccurrence(2025, 2, 29)).toEqual({ year: 2025, month: 2, day: 28 })
    expect(solarOccurrence(2100, 2, 29)).toEqual({ year: 2100, month: 2, day: 28 })
  })

  it('29/2 năm nhuận được giữ', () => {
    expect(solarOccurrence(2024, 2, 29)).toEqual({ year: 2024, month: 2, day: 29 })
    expect(solarOccurrence(2000, 2, 29)).toEqual({ year: 2000, month: 2, day: 29 })
  })

  it('ngày thường được giữ', () => {
    expect(solarOccurrence(2025, 5, 15)).toEqual({ year: 2025, month: 5, day: 15 })
  })
})
