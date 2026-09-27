import { describe, expect, it } from 'vitest'
import { approvalAreaOf, carryFrom, homePathFor, isAdmin, safeInternalPath } from './routing'

describe('homePathFor', () => {
  it('chờ duyệt vào /cho-duyet, không được duyệt vào /khong-duoc-duyet, đã duyệt vào Tổng quan', () => {
    expect(homePathFor({ approvalStatus: 'WAITING' })).toBe('/cho-duyet')
    expect(homePathFor({ approvalStatus: 'REJECTED' })).toBe('/khong-duoc-duyet')
    expect(homePathFor({ approvalStatus: 'APPROVED' })).toBe('/')
  })

  it('Admin cũng theo trạng thái duyệt, không có khu vực riêng', () => {
    expect(homePathFor({ systemRole: 'ADMIN', approvalStatus: 'APPROVED' })).toBe('/')
  })

  it('thiếu trạng thái duyệt thì coi là chờ duyệt để không mở cửa nhầm', () => {
    expect(approvalAreaOf({})).toBe('waiting')
  })
})

describe('isAdmin', () => {
  it('chỉ Admin', () => {
    expect(isAdmin({ systemRole: 'ADMIN' })).toBe(true)
    expect(isAdmin({ systemRole: 'USER' })).toBe(false)
    expect(isAdmin(null)).toBe(false)
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
  it('mang theo đường dẫn nội bộ qua các bước đăng ký', () => {
    expect(carryFrom({ from: '/thanh-vien?q=an' })).toEqual({ from: '/thanh-vien?q=an' })
  })

  it('bỏ qua giá trị không an toàn hoặc không có', () => {
    expect(carryFrom({ from: 'https://evil.com' })).toBeUndefined()
    expect(carryFrom(null)).toBeUndefined()
    expect(carryFrom({ email: 'a@b.c' })).toBeUndefined()
  })
})
