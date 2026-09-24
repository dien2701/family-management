import { SearchX } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <EmptyState
      icon={SearchX}
      title="Không tìm thấy trang"
      description="Đường dẫn này không tồn tại hoặc đã được đổi. Hãy quay về trang Tổng quan."
      action={
        <Button asChild>
          <Link to="/">Về Tổng quan</Link>
        </Button>
      }
    />
  )
}
