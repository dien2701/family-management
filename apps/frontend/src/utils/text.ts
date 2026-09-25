// Chuẩn hóa để tìm không dấu. Giống `search_name` của backend (RULES backend §Dữ liệu):
// bỏ dấu, `đ` thành `d`, chữ thường, gộp khoảng trắng.
export function removeDiacritics(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFC')
}

/** Chữ cái đầu của từ cuối (tên gọi đứng cuối trong tên người Việt), dùng làm avatar chữ. */
export function initialOf(fullName?: string): string {
  return fullName?.trim().split(/\s+/).at(-1)?.[0]?.toUpperCase() ?? '?'
}

export function toSearchName(text: string): string {
  return removeDiacritics(text).toLowerCase().replace(/\s+/g, ' ').trim()
}
