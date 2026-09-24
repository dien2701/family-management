import { Ellipsis } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'

// Trang tạm của Đợt 1, được thay bằng trang của feature ở các đợt sau
export function MorePage() {
  return (
    <EmptyState
      icon={Ellipsis}
      title="Các mục khác đang được xây dựng"
      description="Dòng họ, cài đặt và các tiện ích khác sẽ nằm ở đây."
    />
  )
}
