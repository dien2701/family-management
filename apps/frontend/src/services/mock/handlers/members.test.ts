import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '@/services/client'
import type { MemberDetail, MemberPage, Me } from '@/types/api'
import { handleMock, setMockDelay } from '..'
import type { RealApi } from '../context'
import { forgetMemoryStore, loadStore, saveStore } from '../store'

const admin: Me = { id: 1, systemRole: 'ADMIN', approvalStatus: 'APPROVED', status: 'ACTIVE' }
const user: Me = { id: 2, systemRole: 'USER', approvalStatus: 'APPROVED', status: 'ACTIVE' }
const waiting: Me = { id: 3, systemRole: 'USER', approvalStatus: 'WAITING', status: 'ACTIVE' }

/** Gọi handler như client: `/me` do "backend thật" (hàm giả) trả về theo người đang xét. */
async function call<T>(path: string, query: Record<string, unknown> = {}, viewer: Me = user) {
  const real: RealApi = async (_method, realPath) => {
    if (realPath === '/me') return viewer as never
    throw new Error(`Không được gọi backend thật cho ${realPath}`)
  }
  const result = await handleMock('GET', path, { query }, real)
  if (!result.handled) throw new Error(`Không có handler cho ${path}`)
  return result.data as T
}

const names = (page: MemberPage) => page.items.map((m) => m.fullName)

beforeEach(() => {
  setMockDelay(0)
  localStorage.clear()
  forgetMemoryStore()
})

describe('GET /api/members', () => {
  it('trả trang đầu của 28 thành viên, sắp theo tên A-Z', async () => {
    const page = await call<MemberPage>('/members')
    expect(page).toMatchObject({ page: 0, size: 20, totalElements: 28, totalPages: 2 })
    expect(page.items).toHaveLength(20)
    const sorted = [...names(page)].sort((a, b) => a.localeCompare(b, 'vi'))
    expect(names(page)).toEqual(sorted)
  })

  it('phân trang: trang 1 size 20 còn 8 người, không trùng trang 0', async () => {
    const first = await call<MemberPage>('/members', { page: 0 })
    const second = await call<MemberPage>('/members', { page: 1 })
    expect(second.items).toHaveLength(8)
    const ids = new Set(first.items.map((m) => m.id))
    expect(second.items.some((m) => ids.has(m.id))).toBe(false)
  })

  it('tìm "nguyen van tham" (không dấu) ra "Cụ Nguyễn Văn Tham (Tức Cụ Kai)"', async () => {
    const page = await call<MemberPage>('/members', { q: 'nguyen van tham' })
    expect(names(page)).toEqual(['Cụ Nguyễn Văn Tham (Tức Cụ Kai)'])
  })

  it('tìm có dấu, hoa thường lẫn lộn và đ/d đều được', async () => {
    expect(names(await call<MemberPage>('/members', { q: 'NGUYỄN VĂN THAM' }))).toEqual([
      'Cụ Nguyễn Văn Tham (Tức Cụ Kai)',
    ])
    expect(names(await call<MemberPage>('/members', { q: 'duong' }))).toEqual(
      expect.arrayContaining(['Ông Nguyễn Văn Dương', 'Dương Thu Hương']),
    )
    expect((await call<MemberPage>('/members', { q: 'không có ai tên này' })).items).toEqual([])
  })

  it('"nguyen van" ra các "Nguyễn Văn…"', async () => {
    const page = await call<MemberPage>('/members', { q: 'nguyen van', size: 100 })
    expect(page.totalElements).toBeGreaterThan(5)
    expect(names(page).every((n) => n.includes('Nguyễn Văn'))).toBe(true)
  })

  it('lọc đã mất/còn sống: cả 28 người đều đã mất', async () => {
    expect((await call<MemberPage>('/members', { deceased: 'true' })).totalElements).toBe(28)
    expect((await call<MemberPage>('/members', { deceased: 'false' })).totalElements).toBe(0)
  })

  it('cây còn trống: onTree=true không ai, onTree=false đủ 28, generation không ai', async () => {
    expect((await call<MemberPage>('/members', { onTree: true })).totalElements).toBe(0)
    expect((await call<MemberPage>('/members', { onTree: false })).totalElements).toBe(28)
    expect((await call<MemberPage>('/members', { generation: 1 })).totalElements).toBe(0)
    const first = (await call<MemberPage>('/members')).items[0]!
    expect(first).toMatchObject({ generation: null, onTree: false, birthYear: null })
  })

  it('lọc khoảng tuổi theo năm sinh, loại người chưa rõ năm sinh; sắp theo tuổi', async () => {
    const store = loadStore()
    // Dữ liệu chỉ dùng trong test: người đã mất tính tuổi tới năm mất
    store.members[3]!.birth = { year: 1900, month: null, day: null, calendar: 'SOLAR', leap: false } // mất 1955 → 55
    store.members[6]!.birth = { year: 1930, month: null, day: null, calendar: 'SOLAR', leap: false } // mất 1980 → 50
    store.members[7]!.birth = { year: 1920, month: null, day: null, calendar: 'SOLAR', leap: false } // mất 1986 → 66
    saveStore(store)

    expect(
      (await call<MemberPage>('/members', { ageMin: 50 })).items.map((m) => m.id).sort(),
    ).toEqual([4, 7, 8])
    expect(
      (await call<MemberPage>('/members', { ageMin: 51, ageMax: 60 })).items.map((m) => m.id),
    ).toEqual([4])
    expect((await call<MemberPage>('/members', { ageMax: 49 })).totalElements).toBe(0)

    const byAge = await call<MemberPage>('/members', { sort: 'age' })
    expect(byAge.items.slice(0, 3).map((m) => m.birthYear)).toEqual([1900, 1920, 1930])
  })

  it('sắp theo thời gian thêm: người mới thêm trước', async () => {
    const store = loadStore()
    store.members.push({
      ...store.members[0]!,
      id: 29,
      fullName: 'Người thêm sau',
      createdAt: new Date(Date.now() + 60_000).toISOString(),
    })
    saveStore(store)
    const page = await call<MemberPage>('/members', { sort: 'created' })
    expect(page.items[0]?.fullName).toBe('Người thêm sau')
  })

  it('tham số sai thì trả ProblemDetail 400 VALIDATION_ERROR kèm errors[]', async () => {
    const error = await call('/members', { sort: 'bậy', size: 1000, ageMin: 'x' }).catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_ERROR' })
    expect((error as ApiError).errors.map((e) => e.field).sort()).toEqual([
      'ageMin',
      'size',
      'sort',
    ])
  })

  it('tài khoản chưa duyệt bị 403 ACCOUNT_NOT_APPROVED', async () => {
    await expect(call('/members', {}, waiting)).rejects.toMatchObject({
      status: 403,
      code: 'ACCOUNT_NOT_APPROVED',
    })
  })
})

describe('GET /api/members/{id}', () => {
  it('trả hồ sơ đầy đủ, ngày mất âm và dương', async () => {
    const m = await call<MemberDetail>('/members/4')
    expect(m).toMatchObject({
      id: 4,
      fullName: 'Cụ Nguyễn Văn Sửu',
      isDeceased: true,
      deathYear: 1955,
      deathLunar: { day: 11, month: 7, leap: false, year: 1955 },
      deathSolar: { year: 1955, month: 8, day: 28 },
      burialPlace: 'Nghĩa trang thôn Kim Hoàng, xã Sơn Đồng, TP Hà Nội',
      gender: null,
      birth: null,
    })
  })

  it('id không tồn tại hoặc không phải số trả ProblemDetail 404 MEMBER_NOT_FOUND', async () => {
    for (const id of ['999', '0', 'abc']) {
      const error = await call(`/members/${id}`).catch((e) => e)
      expect(error).toBeInstanceOf(ApiError)
      expect(error).toMatchObject({ status: 404, code: 'MEMBER_NOT_FOUND' })
    }
  })

  it('tài khoản chưa duyệt bị 403 ACCOUNT_NOT_APPROVED', async () => {
    await expect(call('/members/1', {}, waiting)).rejects.toMatchObject({
      status: 403,
      code: 'ACCOUNT_NOT_APPROVED',
    })
  })

  describe('SĐT và email', () => {
    beforeEach(() => {
      // Dữ liệu chỉ dùng trong test
      const store = loadStore()
      store.members[3]!.phone = '0900000004'
      store.members[3]!.email = 'suu@example.test'
      saveStore(store)
    })

    it('User khác không thấy: hai khóa không xuất hiện', async () => {
      const m = await call<MemberDetail>('/members/4', {}, user)
      expect('phone' in m).toBe(false)
      expect('email' in m).toBe(false)
    })

    it('Admin thấy', async () => {
      const m = await call<MemberDetail>('/members/4', {}, admin)
      expect(m).toMatchObject({ phone: '0900000004', email: 'suu@example.test' })
    })

    it('chính chủ (memberId khớp) thấy, hồ sơ người khác thì không', async () => {
      const self = { ...user, memberId: 4 }
      expect(await call<MemberDetail>('/members/4', {}, self)).toMatchObject({
        phone: '0900000004',
        email: 'suu@example.test',
      })
      expect('phone' in (await call<MemberDetail>('/members/5', {}, self))).toBe(false)
    })

    it('danh sách không bao giờ chứa SĐT/email', async () => {
      const page = await call<MemberPage>('/members', {}, admin)
      for (const item of page.items) {
        expect(item).not.toHaveProperty('phone')
        expect(item).not.toHaveProperty('email')
      }
    })
  })
})
