// Kiểm tra dữ liệu ban đầu shared/fixtures/seed/members.json khớp IDEA Phụ lục A (đọc lại chính bảng ở đó).
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import members from '@fixtures/seed/members.json'
import { toLunar, toSolar } from '@/utils/lunar'

type Seed = (typeof members)[number]

const BURIAL = 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội'

/** Đọc bảng Phụ lục A: [họ tên, ngày, tháng, năm?] theo đúng thứ tự dòng (27a, 27b là hai dòng cuối). */
function readAppendixA() {
  const idea = readFileSync(
    path.resolve(import.meta.dirname, '../../../../../roadmap/IDEA.md'),
    'utf8',
  )
  const section = idea.slice(idea.indexOf('## Phụ lục A'))
  const rows: { fullName: string; date: number[] | null }[] = []
  for (const line of section.split(/\r?\n/)) {
    const cells = line.split('|').map((c) => c.trim())
    // Dòng dữ liệu: | # | Họ tên | Ngày mất |, cột # là số hoặc 27a/27b
    if (cells.length < 4 || !/^\d+[ab]?$/.test(cells[1] ?? '')) continue
    const dateText = cells[3] ?? ''
    const date = /^\d/.test(dateText) ? dateText.match(/\d+/g)!.map(Number) : null
    rows.push({ fullName: cells[2]!, date })
  }
  return rows
}

describe('seed members.json (Phụ lục A)', () => {
  const appendix = readAppendixA()

  it('đọc được đúng 28 dòng ở Phụ lục A và đúng 28 người trong file', () => {
    expect(appendix).toHaveLength(28)
    expect(members).toHaveLength(28)
  })

  it('họ tên nguyên văn, đúng thứ tự Phụ lục A', () => {
    expect(members.map((m) => m.fullName)).toEqual(appendix.map((r) => r.fullName))
  })

  it('mọi người đã mất, cùng nơi an táng, không có khoảng trắng thừa', () => {
    for (const m of members) {
      expect(m.isDeceased).toBe(true)
      expect(m.burialPlace).toBe(BURIAL)
      expect(m.fullName).toBe(m.fullName.replace(/\s+/g, ' ').trim())
    }
  })

  it('ngày mất âm khớp Phụ lục A, không nhuận; người thiếu ngày thì không có deathLunar', () => {
    members.forEach((m: Seed, i) => {
      const date = appendix[i]!.date
      if (!date) {
        expect(m).not.toHaveProperty('deathLunar')
        expect(m).not.toHaveProperty('deathSolar')
        return
      }
      const [day, month, year] = date
      expect(m.deathLunar).toEqual(
        year === undefined ? { day, month, leap: false } : { day, month, leap: false, year },
      )
    })
  })

  it('cụ Thêm chỉ có ngày/tháng âm 01/11, không có năm nên không có ngày dương', () => {
    const them = members.find((m) => m.fullName === 'Cụ Nguyễn Thị Thêm')!
    expect(them.deathLunar).toEqual({ day: 1, month: 11, leap: false })
    expect(them).not.toHaveProperty('deathSolar')
  })

  it('deathSolar chỉ có khi có năm âm và khớp lịch âm (đổi qua lại đều ra cùng ngày)', () => {
    for (const m of members as Seed[]) {
      const lunar = m.deathLunar
      if (!lunar || lunar.year === undefined) continue
      const solar = toSolar({ ...lunar, year: lunar.year })
      expect(m.deathSolar).toEqual(solar)
      expect(toLunar(solar)).toEqual({ ...lunar, year: lunar.year })
    }
    expect((members as Seed[]).filter((m) => m.deathSolar)).toHaveLength(21)
  })

  it('không có trường nào ngoài fullName, isDeceased, deathLunar, deathSolar, burialPlace', () => {
    const allowed = new Set(['fullName', 'isDeceased', 'deathLunar', 'deathSolar', 'burialPlace'])
    for (const m of members) {
      for (const key of Object.keys(m)) expect(allowed.has(key)).toBe(true)
    }
  })
})
