import type { RouteObject } from 'react-router'
import { AppShell } from '@/layout/AppShell'
import type { RouteHandle } from '@/types/route'
import { CalendarPage } from './CalendarPage'
import { DashboardPage } from './DashboardPage'
import { MembersPage } from './MembersPage'
import { MorePage } from './MorePage'
import { NotFoundPage } from './NotFoundPage'
import { TreePage } from './TreePage'

const handle = (title: string): RouteHandle => ({ title })

// Guard theo vai trò thêm ở Đợt 3
export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage />, handle: handle('Tổng quan') },
      { path: 'cay', element: <TreePage />, handle: handle('Cây') },
      { path: 'thanh-vien', element: <MembersPage />, handle: handle('Thành viên') },
      { path: 'lich', element: <CalendarPage />, handle: handle('Lịch') },
      { path: 'them', element: <MorePage />, handle: handle('Thêm') },
      { path: '*', element: <NotFoundPage />, handle: handle('Lỗi 404') },
    ],
  },
]
