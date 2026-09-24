import { describe, expect, it } from 'vitest'
import { areaOf, carryFrom, homePathFor, safeInternalPath } from './routing'

describe('homePathFor', () => {
  it('Admin vào khu quản trị, kể cả khi có familyId', () => {
    expect(homePathFor({ systemRole: 'ADMIN' })).toBe('/quan-tri')
    expect(homePathFor({ systemRole: 'ADMIN', familyId: 3 })).toBe('/quan-tri')
  })

  it('chưa có family vào /bat-dau, có family vào Dashboard', () => {
    expect(homePathFor({ systemRole: 'USER' })).toBe('/bat-dau')
    expect(homePathFor({ systemRole: 'USER', familyId: 3 })).toBe('/')
    expect(areaOf({ systemRole: 'USER', familyId: 3 })).toBe('family')
  })
})

describe('safeInternalPath', () => {
  it('chỉ nhận đường dẫn nội bộ', () => {
    expect(safeInternalPath('/cay?x=1')).toBe('/cay?x=1')
    for (const bad of [
      'https://evil.com',
      '//evil.com',
      '/\\evil.com',
      'cay',
      '',
      null,
      undefined,
      5,
    ]) {
      expect(safeInternalPath(bad), String(bad)).toBeNull()
    }
  })
})

describe('carryFrom', () => {
  it('mang theo đường dẫn nội bộ (link mời) qua các bước đăng ký', () => {
    expect(carryFrom({ from: '/moi/ABCD2345' })).toEqual({ from: '/moi/ABCD2345' })
  })

  it('bỏ qua giá trị không an toàn hoặc không có', () => {
    expect(carryFrom({ from: 'https://evil.com' })).toBeUndefined()
    expect(carryFrom(null)).toBeUndefined()
    expect(carryFrom({ email: 'a@b.c' })).toBeUndefined()
  })
})
