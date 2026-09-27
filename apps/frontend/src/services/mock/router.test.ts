import { describe, expect, it } from 'vitest'
import { MockRouter } from './router'

const noop = () => null

describe('MockRouter', () => {
  const router = new MockRouter().on('GET', '/members', noop).on('GET', '/members/:id', noop)

  it('khớp theo method và mẫu path, lấy tham số path', () => {
    expect(router.match('GET', '/members')?.params).toEqual({})
    expect(router.match('get', '/members/12')?.params).toEqual({ id: '12' })
  })

  it('giải mã tham số path', () => {
    expect(router.match('GET', '/members/a%20b')?.params).toEqual({ id: 'a b' })
  })

  it('không khớp sai method, sai số đoạn hoặc path lạ (để gọi backend thật)', () => {
    expect(router.match('POST', '/members')).toBeNull()
    expect(router.match('GET', '/members/1/relatives')).toBeNull()
    expect(router.match('GET', '/auth/login')).toBeNull()
    expect(router.match('GET', '/me')).toBeNull()
  })
})
