import { Outlet } from 'react-router'
import { PushPrompt } from '@/features/notification/components/PushPrompt'
import { BottomNav } from './BottomNav'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppShell() {
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
          <PushPrompt />
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
