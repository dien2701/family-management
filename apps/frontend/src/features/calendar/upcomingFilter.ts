import type { CalendarOccurrence } from '@/types/api'
import { toSearchName } from '@/utils/text'

export type UpcomingFilter = {
  /** Từ khóa theo tên; rỗng là không lọc. */
  q: string
  /** Tháng âm 1–12; `null` là không lọc theo ngày âm. */
  lunarMonth: number | null
  /** Ngày âm 1–30; `null` là cả tháng. Chỉ có nghĩa khi có `lunarMonth`. */
  lunarDay: number | null
}

/** Đọc tham số URL thành số nguyên trong 1..max; sai hoặc ngoài khoảng thì coi như không đặt. */
export function parseLunarParam(value: string | null, max: number): number | null {
  if (value === null || !/^\d+$/.test(value)) return null
  const n = Number(value)
  return n >= 1 && n <= max ? n : null
}

/**
 * Lọc danh sách sự kiện sắp tới ở phía trình duyệt (DECISIONS #88, không đổi API):
 * - tên: không phân biệt hoa thường và dấu, khớp một phần của `title`;
 * - ngày âm: chỉ giữ giỗ có `lunar.month` (và `lunar.day` nếu có) khớp. Tháng nhuận tính chung với tháng thường.
 */
export function filterUpcoming(items: CalendarOccurrence[], f: UpcomingFilter): CalendarOccurrence[] {
  const needle = toSearchName(f.q)
  return items.filter((o) => {
    if (needle && !toSearchName(o.title).includes(needle)) return false
    if (f.lunarMonth !== null) {
      if (o.type !== 'MEMORIAL' || o.lunar.month !== f.lunarMonth) return false
      if (f.lunarDay !== null && o.lunar.day !== f.lunarDay) return false
    }
    return true
  })
}
