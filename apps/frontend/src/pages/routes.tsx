import { Navigate, type RouteObject } from 'react-router'
import { AdminProposalsPage } from '@/features/admin/pages/ProposalsPage'
import { MyProposalsPage } from '@/features/proposal/pages/MyProposalsPage'
import { InboxPage } from '@/features/notification/pages/InboxPage'
import { SettingsPage } from '@/features/notification/pages/SettingsPage'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AccountsPage } from '@/features/admin/pages/AccountsPage'
import { LinkRequestsPage } from '@/features/admin/pages/LinkRequestsPage'
import { DeletedMembersPage } from '@/features/admin/pages/DeletedMembersPage'
import { SettingsPage as AdminSettingsPage } from '@/features/admin/pages/SettingsPage'
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
import { CalendarPage } from '@/features/calendar/pages/CalendarPage'
import { LunarConverterPage } from '@/features/calendar/pages/LunarConverterPage'
import { linkStrings } from '@/features/link/strings'
import { MyIdentityPage } from '@/features/link/pages/MyIdentityPage'
import { AppShell } from '@/layout/AppShell'
import { PlainLayout } from '@/layout/PlainLayout'
import type { RouteHandle } from '@/types/route'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { MembersPage } from '@/features/member/pages/MembersPage'
import { TreePage } from '@/features/tree/pages/TreePage'
import { MemberDetailPage } from '@/features/member/pages/MemberDetailPage'
import { MemberFormPage } from '@/features/member/pages/MemberFormPage'
import { MorePage } from './MorePage'
import { CommonDocumentsPage } from '@/features/files/pages/CommonDocumentsPage'
import { ExportPage } from '@/features/reports/pages/ExportPage'
import { AssistantPage } from '@/features/ai/pages/AssistantPage'
import { aiStrings } from '@/features/ai/strings'
import { NotFoundPage } from './NotFoundPage'

const handle = (title: string): RouteHandle => ({ title })

export const routes: RouteObject[] = [
  // Trang kiểm layout cây (Đợt 14): chỉ có ở dev, nạp động để không lọt vào bản build prod
  ...(import.meta.env.DEV
    ? [
        {
          path: 'dev/cay',
          lazy: async () => ({
            Component: (await import('@/features/tree/pages/TreeLayoutDevPage')).TreeLayoutDevPage,
          }),
          handle: handle('Kiểm tra layout cây'),
        } satisfies RouteObject,
      ]
    : []),
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
              { path: 'thanh-vien/:id', element: <MemberDetailPage />, handle: handle('Hồ sơ thành viên') },
              // Thêm thành viên: chỉ Admin
              {
                element: <RequireAdmin />,
                children: [
                  { path: 'thanh-vien/them', element: <MemberFormPage />, handle: handle('Thêm thành viên') },
                ],
              },
              // Sửa hồ sơ: Admin sửa mọi hồ sơ, User chỉ sửa hồ sơ của mình (trang tự kiểm; quyền thật do máy chủ)
              { path: 'thanh-vien/:id/sua', element: <MemberFormPage />, handle: handle('Sửa hồ sơ') },
              { path: 'lich', element: <CalendarPage />, handle: handle('Lịch') },
              { path: 'them', element: <MorePage />, handle: handle('Thêm') },
              {
                path: 'them/toi-la-ai',
                element: <MyIdentityPage />,
                handle: handle(linkStrings.menu),
              },
              {
                path: 'them/doi-lich',
                element: <LunarConverterPage />,
                handle: handle('Đổi lịch âm – dương'),
              },
              {
                path: 'them/tai-lieu-chung',
                element: <CommonDocumentsPage />,
                handle: handle('Tài liệu chung'),
              },
              {
                path: 'them/xuat-du-lieu',
                element: <ExportPage />,
                handle: handle('Xuất dữ liệu'),
              },
              { path: 'tro-ly', element: <AssistantPage />, handle: handle(aiStrings.title) },
              { path: 'de-xuat', element: <MyProposalsPage />, handle: handle('Đề xuất của tôi') },
              { path: 'thong-bao', element: <InboxPage />, handle: handle('Thông báo') },
              { path: 'thong-bao/cai-dat', element: <SettingsPage />, handle: handle('Cài đặt thông báo') },
              // Khu Quản trị dùng chung AppShell, chỉ Admin vào được
              {
                path: 'quan-tri',
                element: <RequireAdmin />,
                children: [
                  {
                    element: <AdminLayout />,
                    children: [
                      { index: true, element: <Navigate to="/quan-tri/tai-khoan" replace /> },
                      {
                        path: 'tai-khoan',
                        element: <AccountsPage />,
                        handle: handle(adminStrings.accounts.title),
                      },
                      {
                        path: 'yeu-cau-lien-ket',
                        element: <LinkRequestsPage />,
                        handle: handle(adminStrings.linkRequests.title),
                      },
                      {
                        path: 'de-xuat',
                        element: <AdminProposalsPage />,
                        handle: handle('Duyệt đề xuất'),
                      },
                      {
                        path: 'da-xoa',
                        element: <DeletedMembersPage />,
                        handle: handle('Thành viên đã xóa'),
                      },
                      {
                        path: 'cau-hinh',
                        element: <AdminSettingsPage />,
                        handle: handle('Cấu hình hệ thống'),
                      },
                    ],
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
