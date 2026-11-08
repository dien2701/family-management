import { UserRound } from 'lucide-react'
import { Badge } from '@/components/shared/Badge'
import { ListGroup, ListRow } from '@/components/shared/ListRow'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { useAuth } from '@/hooks/useAuth'
import { authStrings } from '../strings'

// Thẻ tài khoản đầu trang Thêm (DESIGN §9): ảnh, tên, email, vai trò và lối vào Hồ sơ cá nhân
export function AccountCard() {
  const { user } = useAuth()
  if (!user) return null
  return (
    <section
      aria-label={authStrings.account}
      className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card md:p-6"
    >
      <div className="flex items-center gap-4">
        <UserAvatar url={user.avatarUrl} name={user.fullName} className="size-16 text-2xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl leading-tight font-bold text-primary">{user.fullName}</p>
          <p className="truncate text-text-muted">{user.email}</p>
          <Badge className="mt-1">{user.systemRole === 'ADMIN' ? 'Admin' : 'User'}</Badge>
        </div>
      </div>
      <ListGroup className="rounded-field border border-border px-3">
        <ListRow
          to="/ho-so"
          icon={UserRound}
          label="Hồ sơ cá nhân"
          description="Ảnh, liên kết thành viên, mật khẩu"
        />
      </ListGroup>
    </section>
  )
}
