/** Ngày dương (tháng 1–12). Giá trị thuần, không kèm múi giờ. */
export type SolarDate = { year: number; month: number; day: number }

/** Một ngày âm lịch. `leap = true` nghĩa là ngày thuộc tháng nhuận `month`. */
export type LunarDate = { year: number; month: number; day: number; leap: boolean }

/** Ngày/tháng âm lặp hằng năm (giỗ, sinh nhật âm, sự kiện âm), không gắn với năm nào. */
export type LunarMonthDay = { month: number; day: number; leap: boolean }

/** Đầu vào sai hoặc ngoài khoảng đã đối chiếu (bản Java ném IllegalArgumentException). */
export class LunarError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LunarError'
  }
}
