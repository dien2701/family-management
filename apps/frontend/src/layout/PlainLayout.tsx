import { TreeDeciduous } from 'lucide-react'
import { Outlet } from 'react-router'
import { useRouteTitle } from '@/hooks/useRouteTitle'

// Khung tối giản (không có thanh điều hướng) cho khu vực chưa vào app: onboarding và quản trị tạm
export function PlainLayout() {
  const title = useRouteTitle()
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-3 px-4 md:px-6 lg:h-16">
          <span className="flex size-10 items-center justify-center rounded-button bg-primary text-primary-fg">
            <TreeDeciduous className="size-6" aria-hidden="true" />
          </span>
          <span className="text-lg leading-tight font-bold text-primary">Tộc Phả</span>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 md:px-6">
        <h1 className="sr-only">{title}</h1>
        <Outlet />
      </main>
    </div>
  )
}
