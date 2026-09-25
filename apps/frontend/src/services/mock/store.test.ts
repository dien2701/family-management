import { beforeEach, describe, expect, it } from 'vitest'
import {
  STORE_KEY,
  exportStoreJson,
  forgetMemoryStore,
  loadStore,
  resetStore,
  saveStore,
} from './store'

beforeEach(() => {
  localStorage.clear()
  forgetMemoryStore()
})

describe('mock store', () => {
  it('lần đầu khởi tạo từ dữ liệu gốc: 28 người, id 1..28, cây trống, ghi vào localStorage', () => {
    const store = loadStore()
    expect(store.members).toHaveLength(28)
    expect(store.members.map((m) => m.id)).toEqual(Array.from({ length: 28 }, (_, i) => i + 1))
    expect(store.tree.nodes).toEqual([])
    expect(JSON.parse(localStorage.getItem(STORE_KEY)!).members).toHaveLength(28)
  })

  it('người trong kho không có dữ liệu nào ngoài tên, đã mất, ngày mất và nơi an táng', () => {
    const [tham, , , suu] = loadStore().members
    expect(tham).toMatchObject({
      fullName: 'Cụ Nguyễn Văn Tham (Tức Cụ Kai)',
      gender: null,
      phone: null,
      email: null,
      birth: null,
      labels: [],
      deathLunar: null,
      deathSolar: null,
    })
    expect(suu?.deathLunar).toEqual({ day: 11, month: 7, leap: false, year: 1955 })
    expect(suu?.deathSolar).toEqual({ year: 1955, month: 8, day: 28 })
  })

  it('đọc lại dữ liệu đã lưu, không khởi tạo lại', () => {
    const store = loadStore()
    store.members[0]!.fullName = 'Đã sửa'
    saveStore(store)
    forgetMemoryStore()
    expect(loadStore().members[0]?.fullName).toBe('Đã sửa')
  })

  it('khôi phục dữ liệu gốc: xóa mọi thứ đã nhập', () => {
    const store = loadStore()
    store.members.push({ ...store.members[0]!, id: 29, fullName: 'Người mới' })
    store.members[1]!.phone = '0900000000'
    saveStore(store)

    const restored = resetStore()
    expect(restored.members).toHaveLength(28)
    expect(restored.members.some((m) => m.fullName === 'Người mới')).toBe(false)
    expect(restored.members[1]?.phone).toBeNull()
    expect(JSON.parse(localStorage.getItem(STORE_KEY)!).members).toHaveLength(28)
  })

  it('dữ liệu hỏng hoặc sai phiên bản thì khởi tạo lại', () => {
    localStorage.setItem(STORE_KEY, '{không phải json')
    expect(loadStore().members).toHaveLength(28)
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ version: 0, members: [], tree: { nodes: [] } }),
    )
    forgetMemoryStore()
    expect(loadStore().members).toHaveLength(28)
  })

  it('xuất JSON để tải về', () => {
    const exported = JSON.parse(exportStoreJson())
    expect(exported.version).toBe(1)
    expect(exported.members).toHaveLength(28)
  })
})
