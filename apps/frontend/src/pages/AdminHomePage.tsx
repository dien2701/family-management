import { ShieldCheck } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { LogoutButton } from '@/features/auth/components/LogoutButton'

// Trang tạm: khu quản trị làm ở GĐ3 (Đợt 34)
export function AdminHomePage() {
  return (
    <EmptyState
      icon={ShieldCheck}
      title="Khu vực quản trị đang được xây dựng"
      description="Quản lý người dùng và dòng họ sẽ nằm ở đây."
      action={<LogoutButton />}
    />
  )
}
