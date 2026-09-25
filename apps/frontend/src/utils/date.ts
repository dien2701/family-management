const VN_DATE = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
})

const VN_TIME = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
})

/** Đổi mốc thời gian (ms) sang giờ `HH:mm` theo giờ +7. */
export function formatTime(timestamp: number): string {
  return VN_TIME.format(new Date(timestamp))
}

/** Đổi thời điểm UTC (ISO) sang ngày `dd/MM/yyyy` theo giờ +7. Thiếu hoặc sai thì trả chuỗi rỗng. */
export function formatDate(iso: string | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : VN_DATE.format(date)
}
