// Kho dữ liệu của lớp giả lập, lưu ở localStorage (key có số phiên bản). Lần đầu khởi tạo từ dữ liệu thật
// `shared/fixtures/seed/members.json`. Chỉ chứa dữ liệu gia phả, không bao giờ chứa token hay bí mật.
import seedMembers from '@fixtures/seed/members.json'
import type { Schemas } from '@/types/api'

export const STORE_KEY = 'giapha.mock.v1'
export const STORE_VERSION = 1

/** Hồ sơ thành viên như lưu trong kho: DTO chi tiết, trừ phần backend tự tính (đời, có trên cây, năm sinh/mất). */
export type StoredMember = Omit<
  Schemas['MemberDetail'],
  'generation' | 'onTree' | 'birthYear' | 'deathYear'
>

/** Ô trên cây. Mô hình đầy đủ do Đợt 14 định nghĩa; hiện chỉ cần đủ để tính "đời" và "có trên cây". */
export type StoredTreeNode = { id: number; memberId: number | null; parentNodeId: number | null }

export type MockStore = {
  version: typeof STORE_VERSION
  members: StoredMember[]
  tree: { nodes: StoredTreeNode[] }
}

type SeedMember = {
  fullName: string
  isDeceased: boolean
  deathLunar?: { day: number; month: number; leap: boolean; year?: number }
  deathSolar?: { year: number; month: number; day: number }
  burialPlace?: string
}

/** Bản gốc: đúng 28 người, id theo thứ tự trong file (bắt đầu từ 1), các trường khác để trống. */
export function buildSeedStore(now: Date = new Date()): MockStore {
  const stamp = now.toISOString()
  const members = (seedMembers as SeedMember[]).map((s, index): StoredMember => ({
    id: index + 1,
    fullName: s.fullName,
    gender: null,
    avatarUrl: null,
    labels: [],
    isDeceased: s.isDeceased,
    tabooName: null,
    phone: null,
    email: null,
    biography: null,
    birth: null,
    deathSolar: s.deathSolar ?? null,
    deathLunar: s.deathLunar ? { ...s.deathLunar, year: s.deathLunar.year ?? null } : null,
    memorialOverride: null,
    burialPlace: s.burialPlace ?? null,
    createdAt: stamp,
    updatedAt: stamp,
  }))
  return { version: STORE_VERSION, members, tree: { nodes: [] } }
}

// localStorage có thể bị chặn (chế độ riêng tư, chính sách trình duyệt): khi đó giữ tạm trong bộ nhớ.
let memory: MockStore | null = null

/** `null` = không đọc được localStorage; `''` = đọc được nhưng chưa có gì. */
function readRaw(): string | null {
  try {
    return localStorage.getItem(STORE_KEY) ?? ''
  } catch {
    return null
  }
}

function isStore(value: unknown): value is MockStore {
  const v = value as Partial<MockStore> | null
  return (
    !!v && v.version === STORE_VERSION && Array.isArray(v.members) && Array.isArray(v.tree?.nodes)
  )
}

/** Đọc kho; chưa có hoặc hỏng thì khởi tạo lại từ dữ liệu gốc. */
export function loadStore(): MockStore {
  const raw = readRaw()
  // localStorage bị chặn: bản trong bộ nhớ là nguồn duy nhất
  if (raw === null) return memory ?? resetStore()
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (isStore(parsed)) return parsed
    } catch {
      // JSON hỏng: rơi xuống khởi tạo lại
    }
  }
  return resetStore()
}

export function saveStore(store: MockStore): void {
  memory = store
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
  } catch {
    // Đầy bộ nhớ hoặc bị chặn: vẫn dùng bản trong bộ nhớ cho phiên này
  }
}

/** Khôi phục dữ liệu gốc (28 người, cây trống), xóa mọi thứ người dùng đã nhập. */
export function resetStore(): MockStore {
  const store = buildSeedStore()
  saveStore(store)
  return store
}

/** JSON để người dùng tải về, giữ lại dữ liệu đã nhập cho Đợt 39 (nối backend thật). */
export function exportStoreJson(): string {
  return JSON.stringify(loadStore(), null, 2)
}

/** Chỉ dùng trong test: quên bản trong bộ nhớ để đọc lại từ localStorage. */
export function forgetMemoryStore(): void {
  memory = null
}
