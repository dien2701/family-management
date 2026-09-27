import { describe, expect, it } from 'vitest'
import {
  emptyDualDate,
  lunarToDualDate,
  resolveDualDate,
  solarToDualDate,
  switchCalendar,
  type DualDateValue,
} from './dualDate'

const solar = (day: string, month: string, year: string): DualDateValue => ({
  calendar: 'solar',
  day,
  month,
  year,
  leap: false,
})
const lunar = (day: string, month: string, year: string, leap = false): DualDateValue => ({
  calendar: 'lunar',
  day,
  month,
  year,
  leap,
})

describe('resolveDualDate: dương → âm', () => {
  it('17/02/2026 là 1/1 âm (Tết Bính Ngọ)', () => {
    const r = resolveDualDate(solar('17', '2', '2026'))
    expect(r).toMatchObject({
      status: 'full',
      calendar: 'solar',
      lunar: { year: 2026, month: 1, day: 1, leap: false },
      monthDays: 30,
      yearLeapMonth: 0,
    })
  })

  it('08/08/2025 là 15/6 nhuận, năm 2025 nhuận tháng 6', () => {
    expect(resolveDualDate(solar('8', '8', '2025'))).toMatchObject({
      status: 'full',
      lunar: { year: 2025, month: 6, day: 15, leap: true },
      yearLeapMonth: 6,
    })
  })

  it('29/02 năm thường là ngày không tồn tại', () => {
    expect(resolveDualDate(solar('29', '2', '2025'))).toMatchObject({
      status: 'invalid',
      field: 'day',
      message: 'Tháng 2 năm 2025 dương lịch chỉ có 28 ngày.',
    })
  })

  it('chặn tháng 13 và năm ngoài khoảng hỗ trợ', () => {
    expect(resolveDualDate(solar('1', '13', '2025'))).toMatchObject({
      status: 'invalid',
      field: 'month',
    })
    expect(resolveDualDate(solar('1', '1', '1899'))).toMatchObject({
      status: 'invalid',
      field: 'year',
    })
    expect(resolveDualDate(solar('1', '1', '2101'))).toMatchObject({
      status: 'invalid',
      field: 'year',
    })
  })
})

describe('resolveDualDate: âm → dương', () => {
  it('15/6 nhuận 2025 là 08/08/2025', () => {
    expect(resolveDualDate(lunar('15', '6', '2025', true))).toMatchObject({
      status: 'full',
      calendar: 'lunar',
      solar: { year: 2025, month: 8, day: 8 },
      monthDays: 29,
    })
  })

  it('15/6 thường 2025 là 09/07/2025', () => {
    expect(resolveDualDate(lunar('15', '6', '2025'))).toMatchObject({
      solar: { year: 2025, month: 7, day: 9 },
    })
  })

  it('cảnh báo ngày 30 của tháng thiếu (tháng 12 năm 2025 chỉ có 29 ngày)', () => {
    expect(resolveDualDate(lunar('30', '12', '2025'))).toMatchObject({
      status: 'invalid',
      field: 'day',
      message: 'Tháng 12 năm 2025 âm lịch chỉ có 29 ngày, không có ngày 30.',
    })
  })

  it('cảnh báo cờ nhuận sai tháng và nói rõ năm nhuận tháng nào', () => {
    expect(resolveDualDate(lunar('1', '5', '2025', true))).toMatchObject({
      status: 'invalid',
      field: 'leap',
      message: 'Năm 2025 âm lịch không có tháng 5 nhuận (năm này nhuận tháng 6).',
    })
    expect(resolveDualDate(lunar('1', '5', '2026', true))).toMatchObject({
      message: 'Năm 2026 âm lịch không có tháng 5 nhuận (năm này không nhuận).',
    })
  })

  it('năm âm 1899 vẫn được đổi, 1898 thì không', () => {
    expect(resolveDualDate(lunar('1', '12', '1899'))).toMatchObject({ status: 'full' })
    expect(resolveDualDate(lunar('1', '1', '1898'))).toMatchObject({
      status: 'invalid',
      field: 'year',
    })
  })
})

describe('resolveDualDate: nhập thiếu', () => {
  it('rỗng và gõ dở', () => {
    expect(resolveDualDate(emptyDualDate())).toEqual({ status: 'empty' })
    expect(resolveDualDate(solar('17', '', '2026'))).toMatchObject({ status: 'incomplete' })
    // Không cho phép chỉ nhập năm thì năm một mình cũng là chưa đủ
    expect(resolveDualDate(solar('', '', '2026'))).toMatchObject({ status: 'incomplete' })
  })

  it('cho phép chỉ nhập năm', () => {
    expect(resolveDualDate(solar('', '', '1990'), { allowYearOnly: true })).toEqual({
      status: 'yearOnly',
      calendar: 'solar',
      year: 1990,
    })
    expect(resolveDualDate(lunar('', '', '1990'), { allowYearOnly: true })).toMatchObject({
      status: 'yearOnly',
      calendar: 'lunar',
    })
  })

  it('cho phép chỉ nhập ngày/tháng âm, áp quy tắc giỗ', () => {
    const opts = { allowNoYear: true, referenceLunarYear: 2024 }
    // Tháng 6 năm 2024 thiếu: ngày 30 cúng 29 (03/08/2024)
    expect(resolveDualDate(lunar('30', '6', ''), opts)).toMatchObject({
      status: 'lunarMonthDay',
      year: 2024,
      occurrence: { day: 29, month: 6, leap: false },
      occurrenceSolar: { year: 2024, month: 8, day: 3 },
      movedFrom30: true,
      movedFromLeap: false,
    })
    // Ngày của tháng nhuận cúng vào tháng thường
    expect(
      resolveDualDate(lunar('15', '6', '', true), { allowNoYear: true, referenceLunarYear: 2026 }),
    ).toMatchObject({
      occurrence: { day: 15, month: 6, leap: false },
      occurrenceSolar: { year: 2026, month: 7, day: 28 },
      movedFromLeap: true,
    })
  })

  it('không cho phép ngày/tháng âm không năm nếu không bật allowNoYear', () => {
    expect(resolveDualDate(lunar('15', '6', ''))).toMatchObject({ status: 'incomplete' })
  })
})

describe('switchCalendar', () => {
  it('ngày hợp lệ được đổi sang số của lịch kia', () => {
    expect(switchCalendar(solar('8', '8', '2025'), 'lunar')).toEqual(
      lunarToDualDate({ year: 2025, month: 6, day: 15, leap: true }),
    )
    expect(switchCalendar(lunar('15', '6', '2025', true), 'solar')).toEqual(
      solarToDualDate({ year: 2025, month: 8, day: 8 }),
    )
  })

  it('ngày gõ dở hoặc sai thì giữ nguyên chữ, bỏ cờ nhuận', () => {
    expect(switchCalendar(solar('17', '', '2026'), 'lunar')).toEqual(lunar('17', '', '2026'))
    expect(switchCalendar(lunar('30', '12', '2025', false), 'solar')).toEqual(
      solar('30', '12', '2025'),
    )
  })

  it('cùng lịch thì không đổi', () => {
    const v = solar('1', '1', '2026')
    expect(switchCalendar(v, 'solar')).toBe(v)
  })
})
