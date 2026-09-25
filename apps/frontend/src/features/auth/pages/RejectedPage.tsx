import { UserX } from 'lucide-react'
import { ApprovalStatusCard } from '../components/ApprovalStatusCard'
import { LogoutButton } from '../components/LogoutButton'
import { authStrings as s } from '../strings'

// `/khong-duoc-duyet`: tài khoản REJECTED. Admin duyệt lại thì người dùng đăng nhập lại để lấy phiên mới
// (refresh token đã bị thu hồi lúc từ chối), nên trang này không tự kiểm tra lại.
export function RejectedPage() {
  return (
    <ApprovalStatusCard
      icon={UserX}
      tone="danger"
      title={s.rejected.title}
      description={s.rejected.description}
    >
      <LogoutButton className="w-full" />
    </ApprovalStatusCard>
  )
}
