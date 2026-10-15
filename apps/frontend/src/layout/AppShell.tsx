import { Outlet } from 'react-router'
import { isApproved } from '@/features/auth/routing'
import { PushPrompt } from '@/features/notification/components/PushPrompt'
import { FillTransferDialog } from '@/features/prayer/components/FillTransferDialog'
import { useAuth } from '@/hooks/useAuth'
import { AccessBanner } from './AccessBanner'
import { BottomNav } from './BottomNav'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const { user } = useAuth()
  return (
    <div className="min-h-dvh md:flex">
      <a
        href="#main"
        className="sr-only rounded-button bg-primary px-4 py-2 text-primary-fg focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
      >
        Bỏ qua tới nội dung
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-6 md:py-6 md:pb-6"
        >
          <AccessBanner />
          {/* Thông báo đẩy: đã duyệt gắn với tài khoản, còn lại nhận như khách (DECISIONS #89) */}
          <PushPrompt mode={isApproved(user) ? 'account' : 'guest'} />
          <Outlet />
          {/* Hỏi chuyển thông tin bài khấn đã điền trên máy vào tài khoản sau khi đăng nhập (DECISIONS #90) */}
          <FillTransferDialog />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
