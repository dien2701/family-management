// Đọc bộ đối chiếu dùng chung `shared/fixtures/lunar` (sinh từ bảng của Hồ Ngọc Đức, không từ code lịch).
// Chỉ dùng trong test: file JSON nằm ngoài apps/frontend và không được đóng vào bản build.
import lunarYears from '@fixtures/lunar/lunar-years.json'
import samplesFile from '@fixtures/lunar/samples.json'
import { parseIso } from './solarDate'
import type { LunarDate, SolarDate } from './types'

export type FixtureMonth = { month: number; leap: boolean; start: SolarDate; days: number }
export type FixtureYear = {
  year: number
  tet: SolarDate
  leapMonth: number
  months: FixtureMonth[]
}
export type FixtureSample = { solar: SolarDate; lunar: LunarDate; note: string }

export const fixtureYears: FixtureYear[] = lunarYears.years.map((y) => ({
  year: y.year,
  tet: parseIso(y.tet),
  leapMonth: y.leapMonth,
  months: y.months.map((m) => ({
    month: m.month,
    leap: m.leap,
    start: parseIso(m.start),
    days: m.days,
  })),
}))

export const fixtureSamples: FixtureSample[] = samplesFile.samples.map((s) => ({
  solar: parseIso(s.solar),
  lunar: s.lunar,
  note: s.note,
}))
