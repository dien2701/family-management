import { LayoutDashboard } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'

// Trang tạm của Đợt 1, được thay bằng trang của feature ở các đợt sau
export function DashboardPage() {
  return (
    <EmptyState
      icon={LayoutDashboard}
      title="Tổng quan đang được xây dựng"
      description="Số liệu và sự kiện sắp tới của gia phả sẽ hiện ở đây."
    />
  )
}
