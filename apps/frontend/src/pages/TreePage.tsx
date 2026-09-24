import { Network } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'

// Trang tạm của Đợt 1, được thay bằng trang của feature ở các đợt sau
export function TreePage() {
  return (
    <EmptyState
      icon={Network}
      title="Cây gia phả đang được xây dựng"
      description="Sơ đồ các đời trong dòng họ sẽ hiện ở đây."
    />
  )
}
