// Thông tin đã điền của khách và tài khoản chưa duyệt, lưu trên máy (DECISIONS #90). Một khóa duy nhất:
// map `prayerId` → { tên ô → giá trị }. Mọi đọc/ghi bọc try/catch vì localStorage có thể bị chặn.
export type FillValues = Record<string, string>
export type LocalFills = Record<string, FillValues>

const KEY = 'tocpha.prayerFills'
const DECLINED_KEY = 'tocpha.prayerFillsDeclined'

function isStringMap(value: unknown): value is FillValues {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((v) => typeof v === 'string')
  )
}

export function readLocalFills(): LocalFills {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    if (typeof parsed !== 'object' || parsed === null) return {}
    return Object.fromEntries(Object.entries(parsed).filter(([, v]) => isStringMap(v))) as LocalFills
  } catch {
    return {}
  }
}

function writeLocalFills(fills: LocalFills) {
  try {
    if (Object.keys(fills).length === 0) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, JSON.stringify(fills))
  } catch {
    // Không ghi được (chế độ riêng tư, hết dung lượng): bỏ qua, người dùng vẫn đọc được bài
  }
}

export function readLocalFill(prayerId: number): FillValues {
  return readLocalFills()[String(prayerId)] ?? {}
}

/** Không có giá trị nào thì xóa hẳn mục của bài đó. */
export function saveLocalFill(prayerId: number, values: FillValues) {
  const fills = readLocalFills()
  if (Object.keys(values).length === 0) delete fills[String(prayerId)]
  else fills[String(prayerId)] = values
  writeLocalFills(fills)
}

export function removeLocalFill(prayerId: number) {
  const fills = readLocalFills()
  delete fills[String(prayerId)]
  writeLocalFills(fills)
}

/** Chữ ký nội dung trên máy, ổn định theo thứ tự khóa, để nhớ "không chuyển" tới khi dữ liệu đổi. */
export function fillsSignature(fills: LocalFills): string {
  return JSON.stringify(
    Object.keys(fills)
      .sort()
      .map((id) => [id, Object.entries(fills[id] ?? {}).sort(([a], [b]) => a.localeCompare(b))]),
  )
}

export function readDeclinedSignature(): string | null {
  try {
    return localStorage.getItem(DECLINED_KEY)
  } catch {
    return null
  }
}

export function writeDeclinedSignature(signature: string) {
  try {
    localStorage.setItem(DECLINED_KEY, signature)
  } catch {
    // Không nhớ được thì lần sau hỏi lại, không sao
  }
}
