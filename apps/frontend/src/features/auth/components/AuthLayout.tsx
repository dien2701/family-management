import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { BrandHeader } from '@/components/shared/BrandHeader'
import { Button } from '@/components/ui/button'
import { useRouteTitle } from '@/hooks/useRouteTitle'
import { authStrings } from '../strings'

type AuthLayoutProps = {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

// Khung chung cho các trang công khai: header thương hiệu, form trong một thẻ giữa màn hình,
// nút chính rộng toàn bộ thẻ (DESIGN §4, §6, §9)
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  useRouteTitle() // đặt document.title theo route
  return (
    <div className="flex min-h-dvh flex-col">
      <BrandHeader
        to="/"
        linkLabel={`${authStrings.brand} – ${authStrings.backToDashboard}`}
      />
      <div className="flex flex-1 flex-col items-center px-4 py-6 md:justify-center md:py-12">
        <main
          id="main"
          className="w-full max-w-md rounded-card border border-border bg-surface p-4 shadow-card md:p-6"
        >
          <h1 className="text-2xl leading-tight font-bold text-primary">{title}</h1>
          {description && <p className="mt-2 text-text-muted">{description}</p>}
          <div className="mt-6">{children}</div>
          <Button asChild variant="secondary" className="mt-4 w-full">
            <Link to="/">
              <ArrowLeft aria-hidden="true" />
              {authStrings.backToDashboard}
            </Link>
          </Button>
        </main>
        {footer && <div className="mt-6 text-center">{footer}</div>}
      </div>
    </div>
  )
}
