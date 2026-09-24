import { Users } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'

// Trang tạm của Đợt 1, được thay bằng trang của feature ở các đợt sau
export function MembersPage() {
  return (
    <EmptyState
      icon={Users}
      title="Danh sách thành viên đang được xây dựng"
      description="Bạn sẽ tìm, lọc và xem hồ sơ từng người ở đây."
    />
  )
}
