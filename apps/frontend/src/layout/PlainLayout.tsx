import { Outlet } from 'react-router'
import { BrandHeader } from '@/components/shared/BrandHeader'
import { useRouteTitle } from '@/hooks/useRouteTitle'

// Khung tối giản (không có thanh điều hướng) cho tài khoản chưa vào được app: chờ duyệt và không được duyệt
export function PlainLayout() {
  const title = useRouteTitle()
  return (
    <div className="flex min-h-dvh flex-col">
      <BrandHeader />
      <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 md:px-6 md:py-12">
        <h1 className="sr-only">{title}</h1>
        <Outlet />
      </main>
    </div>
  )
}
