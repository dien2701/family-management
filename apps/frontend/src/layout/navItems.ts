import {
  CalendarDays,
  Ellipsis,
  LayoutDashboard,
  Network,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

// 5 mục dùng chung cho Sidebar, rail và BottomNav (DESIGN §4)
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/cay', label: 'Cây', icon: Network },
  { to: '/thanh-vien', label: 'Thành viên', icon: Users },
  { to: '/lich', label: 'Lịch', icon: CalendarDays },
  { to: '/them', label: 'Thêm', icon: Ellipsis },
]
