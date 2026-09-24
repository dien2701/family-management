import { TreeDeciduous } from 'lucide-react'
import type { ReactNode } from 'react'
import { useRouteTitle } from '@/hooks/useRouteTitle'
import { authStrings } from '../strings'

type AuthLayoutProps = {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

// Khung chung cho các trang công khai: một cột, thẻ giữa màn hình (DESIGN §4, §6)
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  useRouteTitle() // đặt document.title theo route
  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-8 md:justify-center md:py-12">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-button bg-primary text-primary-fg">
          <TreeDeciduous className="size-6" aria-hidden="true" />
        </span>
        <span className="text-lg leading-tight font-bold text-primary">{authStrings.brand}</span>
      </div>
      <main className="w-full max-w-md rounded-card border border-border bg-surface p-4 shadow-card md:p-6">
        <h1 className="text-xl leading-tight font-bold md:text-2xl">{title}</h1>
        {description && <p className="mt-2 text-text-muted">{description}</p>}
        <div className="mt-6">{children}</div>
      </main>
      {footer && <div className="mt-6 text-center">{footer}</div>}
    </div>
  )
}
