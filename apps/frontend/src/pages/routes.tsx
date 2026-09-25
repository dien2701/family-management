import { Navigate, type RouteObject } from 'react-router'
import { AccountsPage } from '@/features/admin/pages/AccountsPage'
import { adminStrings } from '@/features/admin/strings'
import {
  ApprovalGuard,
  GuestOnly,
  RequireAdmin,
  RequireAuth,
} from '@/features/auth/components/guards'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { PolicyPage } from '@/features/auth/pages/PolicyPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { RejectedPage } from '@/features/auth/pages/RejectedPage'
import { VerifyOtpPage } from '@/features/auth/pages/VerifyOtpPage'
import { WaitingApprovalPage } from '@/features/auth/pages/WaitingApprovalPage'
import { LunarConverterPage } from '@/features/calendar/pages/LunarConverterPage'
import { AppShell } from '@/layout/AppShell'
import { PlainLayout } from '@/layout/PlainLayout'
import type { RouteHandle } from '@/types/route'
import { CalendarPage } from './CalendarPage'
import { DashboardPage } from './DashboardPage'
import { MembersPage } from './MembersPage'
import { MorePage } from './MorePage'
import { NotFoundPage } from './NotFoundPage'
import { TreePage } from './TreePage'

const handle = (title: string): RouteHandle => ({ title })

export const routes: RouteObject[] = [
  // Công khai: người đã đăng nhập bị chuyển tới trang đích theo trạng thái duyệt
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
  // Cần đăng nhập, rồi chia theo trạng thái duyệt: chờ duyệt, không được duyệt, hoặc vào app (DECISIONS #56)
  {
    element: <RequireAuth />,
    children: [
      {
        element: <ApprovalGuard area="waiting" />,
        children: [
          {
            element: <PlainLayout />,
            children: [{ path: 'cho-duyet', element: <WaitingApprovalPage />, handle: handle('Chờ duyệt') }],
          },
        ],
      },
      {
        element: <ApprovalGuard area="rejected" />,
        children: [
          {
            element: <PlainLayout />,
            children: [
              {
                path: 'khong-duoc-duyet',
                element: <RejectedPage />,
                handle: handle('Không được duyệt'),
              },
            ],
          },
        ],
      },
      {
        element: <ApprovalGuard area="app" />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <DashboardPage />, handle: handle('Tổng quan') },
              { path: 'cay', element: <TreePage />, handle: handle('Cây') },
              { path: 'thanh-vien', element: <MembersPage />, handle: handle('Thành viên') },
              { path: 'lich', element: <CalendarPage />, handle: handle('Lịch') },
              { path: 'them', element: <MorePage />, handle: handle('Thêm') },
              {
                path: 'them/doi-lich',
                element: <LunarConverterPage />,
                handle: handle('Đổi lịch âm – dương'),
              },
              // Khu Quản trị dùng chung AppShell, chỉ Admin vào được
              {
                path: 'quan-tri',
                element: <RequireAdmin />,
                children: [
                  { index: true, element: <Navigate to="/quan-tri/tai-khoan" replace /> },
                  {
                    path: 'tai-khoan',
                    element: <AccountsPage />,
                    handle: handle(adminStrings.accounts.title),
                  },
                ],
              },
              { path: '*', element: <NotFoundPage />, handle: handle('Lỗi 404') },
            ],
          },
        ],
      },
    ],
  },
]
