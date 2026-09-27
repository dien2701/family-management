import {
  CalendarDays,
  Ellipsis,
  LayoutDashboard,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'

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
  { to: '/cay', label: 'Cây', icon: Network },
  { to: '/thanh-vien', label: 'Thành viên', icon: Users },
  { to: '/lich', label: 'Lịch', icon: CalendarDays },
  { to: '/them', label: 'Thêm', icon: Ellipsis, alsoActiveFor: ['/quan-tri', '/tro-ly'] },
]

// Trợ lý AI: có ở Sidebar và rail; trên điện thoại vào từ trang Thêm (thanh dưới giữ đúng 5 mục).
export const AI_NAV_ITEM: NavItem = { to: '/tro-ly', label: 'Trợ lý', icon: Sparkles }

// Chỉ Admin thấy. Có ở Sidebar và rail; trên điện thoại nằm trong trang Thêm (thanh dưới giữ đúng 5 mục).
export const ADMIN_NAV_ITEM: NavItem = { to: '/quan-tri', label: 'Quản trị', icon: ShieldCheck }
