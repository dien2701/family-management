import {
  CalendarDays,
  Ellipsis,
  LayoutDashboard,
  LogIn,
  Network,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { homePathFor, isApproved } from '@/features/auth/routing'
import type { Me } from '@/types/api'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  /** Các đường dẫn khác cũng làm mục này sáng lên (ví dụ Thêm chứa cả khu Quản trị trên điện thoại). */
  alsoActiveFor?: readonly string[]
}

// 5 mục dùng chung cho Sidebar, rail và BottomNav (DESIGN §4). BottomNav luôn đúng 5 mục.
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/cay', label: 'Cây gia phả', icon: Network },
  { to: '/thanh-vien', label: 'Thành viên', icon: Users },
  { to: '/lich', label: 'Sự kiện', icon: CalendarDays },
  { to: '/them', label: 'Thêm', icon: Ellipsis, alsoActiveFor: ['/quan-tri', '/tro-ly', '/bai-khan'] },
]

/**
 * 5 mục theo người xem. Khách và tài khoản chưa duyệt chỉ có các trang xem công khai (DECISIONS #88), nên mục "Thêm"
 * (toàn trang cần đăng nhập) đổi thành lối vào đăng nhập hoặc trang trạng thái duyệt; thanh dưới vẫn đúng 5 mục.
 */
export function navItemsFor(user: Me | null): readonly NavItem[] {
  if (isApproved(user)) return NAV_ITEMS
  const access: NavItem = user
    ? { to: homePathFor(user), label: 'Tài khoản', icon: UserRound }
    : { to: '/dang-nhap', label: 'Đăng nhập', icon: LogIn }
  return [...NAV_ITEMS.slice(0, -1), access]
}

// Trợ lý AI: có ở Sidebar và rail; trên điện thoại vào từ trang Thêm (thanh dưới giữ đúng 5 mục).
export const AI_NAV_ITEM: NavItem = { to: '/tro-ly', label: 'Trợ lý', icon: Sparkles }

// Bài khấn xem công khai (DECISIONS #90). Khách và tài khoản chưa duyệt không có trang Thêm, nên Sidebar và rail
// chèn mục này riêng; tài khoản đã duyệt vào từ trang Thêm. Trên điện thoại, khách vào từ thẻ ở Trang chủ.
export const PRAYER_NAV_ITEM: NavItem = { to: '/bai-khan', label: 'Bài khấn', icon: ScrollText }

// Chỉ Admin thấy. Có ở Sidebar và rail; trên điện thoại nằm trong trang Thêm (thanh dưới giữ đúng 5 mục).
export const ADMIN_NAV_ITEM: NavItem = { to: '/quan-tri', label: 'Quản trị', icon: ShieldCheck }
