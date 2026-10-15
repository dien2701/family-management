import { prayerStrings } from './strings'

// Ô trống `{Tên ô}`: không chứa ngoặc nhọn hay xuống dòng. Phải khớp `SLOT` của PrayerService ở backend.
const SLOT = /\{([^{}\r\n]*)\}/g

export const MAX_SLOTS = 30
export const MAX_SLOT_NAME = 50
export const MAX_VALUE = 500
/** Chỗ trống hiện trong bài khi người dùng chưa điền. */
export const BLANK = '........'

/** Tên các ô trong bài, theo thứ tự xuất hiện, không trùng. Ô rỗng `{}` không tính. */
export function extractSlots(content: string): string[] {
  const names = new Set<string>()
  for (const m of content.matchAll(SLOT)) {
    const name = m[1].trim()
    if (name) names.add(name)
  }
  return [...names]
}

/** Thay mỗi `{Tên ô}` bằng giá trị đã điền, ô chưa điền hiện `........`. */
export function fillContent(content: string, values: Record<string, string>): string {
  return content.replace(SLOT, (whole, raw: string) => {
    const name = raw.trim()
    if (!name) return whole
    return values[name]?.trim() || BLANK
  })
}

/** Lỗi nội dung theo quy tắc của backend (tên ô 1–50 ký tự, tối đa 30 ô khác nhau), hoặc `null` nếu hợp lệ. */
export function slotError(content: string): string | null {
  const names = new Set<string>()
  for (const m of content.matchAll(SLOT)) {
    const name = m[1].trim()
    if (!name || name.length > MAX_SLOT_NAME) return prayerStrings.form.slotNameLength
    names.add(name)
  }
  return names.size > MAX_SLOTS ? prayerStrings.form.slotCount : null
}
