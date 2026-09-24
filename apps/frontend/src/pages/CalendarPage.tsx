import { CalendarDays } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'

// Trang tạm của Đợt 1, được thay bằng trang của feature ở các đợt sau
export function CalendarPage() {
  return (
    <EmptyState
      icon={CalendarDays}
      title="Lịch đang được xây dựng"
      description="Ngày giỗ, sinh nhật và sự kiện theo lịch âm – dương sẽ hiện ở đây."
    />
  )
}
