// Chuỗi UI của module calendar (không dùng i18n, chỉ tiếng Việt)
import { MAX_YEAR, MIN_YEAR } from '@/utils/lunar'

export const calendarStrings = {
  converter: {
    title: 'Đổi lịch âm – dương',
    description:
      'Chọn nhập theo dương lịch hoặc âm lịch, ngày ở lịch còn lại hiện ngay bên dưới. Tính theo giờ Việt Nam (UTC+7).',
    field: 'Ngày cần đổi',
    today: 'Hôm nay',
    range: `Hỗ trợ năm dương ${MIN_YEAR}–${MAX_YEAR}. Với âm lịch, nhớ tick “Tháng nhuận” nếu là tháng nhuận.`,
  },
} as const
