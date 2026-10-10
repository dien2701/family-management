import { Clock } from 'lucide-react'
import { Link } from 'react-router'
import { approvalAreaOf, homePathFor } from '@/features/auth/routing'
import { useAuth } from '@/hooks/useAuth'

/**
 * Dải nhắc cho tài khoản chưa được duyệt đang xem các trang công khai (DECISIONS #88). Khách và tài khoản đã duyệt
 * không thấy gì.
 */
export function AccessBanner() {
  const { user } = useAuth()
  if (!user) return null
  const area = approvalAreaOf(user)
  if (area === 'app') return null

  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-field bg-warning-bg px-4 py-3 text-base text-warning"
    >
      <Clock className="size-5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        {area === 'rejected'
          ? 'Tài khoản không được duyệt. Bạn chỉ xem được thông tin chung của gia phả.'
          : 'Tài khoản đang chờ Admin duyệt. Bạn xem được thông tin chung; các chức năng khác mở sau khi được duyệt.'}
      </span>
      <Link
        to={homePathFor(user)}
        className="inline-flex min-h-11 items-center font-semibold underline underline-offset-2"
      >
        Xem trạng thái
      </Link>
    </div>
  )
}
