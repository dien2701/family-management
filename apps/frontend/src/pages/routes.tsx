import type { RouteObject } from 'react-router'
import { AreaGuard, GuestOnly, RequireAuth } from '@/features/auth/components/guards'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { VerifyOtpPage } from '@/features/auth/pages/VerifyOtpPage'
import { FamilyPage } from '@/features/family/pages/FamilyPage'
import { InvitePage } from '@/features/family/pages/InvitePage'
import { OnboardingPage } from '@/features/family/pages/OnboardingPage'
import { PolicyPage } from '@/features/family/pages/PolicyPage'
import { AppShell } from '@/layout/AppShell'
import { PlainLayout } from '@/layout/PlainLayout'
import type { RouteHandle } from '@/types/route'
import { AdminHomePage } from './AdminHomePage'
import { CalendarPage } from './CalendarPage'
import { DashboardPage } from './DashboardPage'
import { MembersPage } from './MembersPage'
import { MorePage } from './MorePage'
import { NotFoundPage } from './NotFoundPage'
import { TreePage } from './TreePage'

const handle = (title: string): RouteHandle => ({ title })

export const routes: RouteObject[] = [
  // Công khai: người đã đăng nhập bị chuyển tới trang đích theo vai trò
  {
    element: <GuestOnly />,
    children: [
      { path: 'dang-nhap', element: <LoginPage />, handle: handle('Đăng nhập') },
      { path: 'dang-ky', element: <RegisterPage />, handle: handle('Đăng ký') },
      { path: 'xac-thuc', element: <VerifyOtpPage />, handle: handle('Xác thực email') },
      { path: 'quen-mat-khau', element: <ForgotPasswordPage />, handle: handle('Quên mật khẩu') },
    ],
  },
  // Trang tĩnh công khai, ai cũng đọc được
  { path: 'chinh-sach-bao-mat', element: <PolicyPage />, handle: handle('Chính sách bảo mật') },
  // Cần đăng nhập, rồi chia ba khu: family (app chính), onboarding (chưa có family), admin
  {
    element: <RequireAuth />,
    children: [
      {
        // Link mời: mọi người đã đăng nhập đều mở được, trang tự xử lý theo khu vực của họ
        element: <PlainLayout />,
        children: [{ path: 'moi/:code', element: <InvitePage />, handle: handle('Lời mời') }],
      },
      {
        element: <AreaGuard area="family" />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <DashboardPage />, handle: handle('Tổng quan') },
              { path: 'cay', element: <TreePage />, handle: handle('Cây') },
              { path: 'thanh-vien', element: <MembersPage />, handle: handle('Thành viên') },
              { path: 'lich', element: <CalendarPage />, handle: handle('Lịch') },
              { path: 'them', element: <MorePage />, handle: handle('Thêm') },
              { path: 'them/dong-ho', element: <FamilyPage />, handle: handle('Dòng họ') },
              { path: '*', element: <NotFoundPage />, handle: handle('Lỗi 404') },
            ],
          },
        ],
      },
      {
        element: <AreaGuard area="onboarding" />,
        children: [
          {
            element: <PlainLayout />,
            children: [{ path: 'bat-dau', element: <OnboardingPage />, handle: handle('Bắt đầu') }],
          },
        ],
      },
      {
        element: <AreaGuard area="admin" />,
        children: [
          {
            element: <PlainLayout />,
            children: [
              { path: 'quan-tri', element: <AdminHomePage />, handle: handle('Quản trị') },
            ],
          },
        ],
      },
    ],
  },
]
