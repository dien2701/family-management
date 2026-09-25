import { describe, expect, it } from 'vitest'
import type { AccountAdmin } from '@/types/api'
import { actionsFor, displayStatusOf, statusFilterToQuery } from './accountRules'

const account = (over: Partial<AccountAdmin>): AccountAdmin => ({
  id: 10,
  fullName: 'Người khác',
  systemRole: 'USER',
  status: 'ACTIVE',
  approvalStatus: 'APPROVED',
  ...over,
})

describe('displayStatusOf', () => {
  it('khóa được ưu tiên hơn trạng thái duyệt', () => {
    expect(displayStatusOf(account({ status: 'LOCKED' }))).toBe('locked')
    expect(displayStatusOf(account({ approvalStatus: 'WAITING' }))).toBe('waiting')
    expect(displayStatusOf(account({ approvalStatus: 'REJECTED' }))).toBe('rejected')
    expect(displayStatusOf(account({}))).toBe('approved')
  })
})

describe('actionsFor', () => {
  it('chờ duyệt: duyệt hoặc từ chối', () => {
    expect(actionsFor(account({ approvalStatus: 'WAITING' }), 1)).toEqual(['approve', 'reject'])
  })

  it('bị từ chối: chỉ duyệt lại', () => {
    expect(actionsFor(account({ approvalStatus: 'REJECTED' }), 1)).toEqual(['approve'])
  })

  it('đã duyệt: User được cấp Admin hoặc khóa; Admin được gỡ quyền hoặc khóa', () => {
    expect(actionsFor(account({}), 1)).toEqual(['grant-admin', 'lock'])
    expect(actionsFor(account({ systemRole: 'ADMIN' }), 1)).toEqual(['revoke-admin', 'lock'])
  })

  it('đang khóa: chỉ mở khóa', () => {
    expect(actionsFor(account({ status: 'LOCKED' }), 1)).toEqual(['unlock'])
  })

  it('dòng của chính mình không có nút tự gỡ quyền hay tự khóa', () => {
    expect(actionsFor(account({ id: 1, systemRole: 'ADMIN' }), 1)).toEqual([])
  })
})

describe('statusFilterToQuery', () => {
  it('đổi ô lọc thành tham số API', () => {
    expect(statusFilterToQuery(undefined)).toEqual({})
    expect(statusFilterToQuery('WAITING')).toEqual({ approval: 'WAITING' })
    expect(statusFilterToQuery('REJECTED')).toEqual({ approval: 'REJECTED' })
    expect(statusFilterToQuery('APPROVED')).toEqual({ approval: 'APPROVED', status: 'ACTIVE' })
    expect(statusFilterToQuery('LOCKED')).toEqual({ status: 'LOCKED' })
  })
})
