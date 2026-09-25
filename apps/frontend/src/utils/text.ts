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

export function toSearchName(text: string): string {
  return removeDiacritics(text).toLowerCase().replace(/\s+/g, ' ').trim()
}
