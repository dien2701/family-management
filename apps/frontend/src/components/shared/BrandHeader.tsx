import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/utils/cn'

type BrandHeaderProps = {
  /** Có thì logo là link (ví dụ về Trang chủ), không thì chỉ là chữ. */
  to?: string
  linkLabel?: string
  /** Bề ngang nội dung, khớp với cột nội dung của trang. */
  className?: string
  children?: ReactNode
}

// Header thương hiệu cho các trang ngoài AppShell (đăng nhập, chờ duyệt, chính sách): nền xanh nhạt,
// logo favicon.svg + "Tộc Phả", không khẩu hiệu (DESIGN §9, DECISIONS #96)
export function BrandHeader({ to, linkLabel, className, children }: BrandHeaderProps) {
  const brand = (
    <>
      <img src="/favicon.svg" alt="" width={36} height={36} className="size-9" />
      <span className="text-xl leading-tight font-bold text-primary">Tộc Phả</span>
    </>
  )
  return (
    <header className="border-b border-border/60 bg-header">
      <div className={cn('mx-auto flex h-14 max-w-[1200px] items-center gap-2 px-4 md:px-6 lg:h-16', className)}>
        {to ? (
          <Link
            to={to}
            aria-label={linkLabel}
            title={linkLabel}
            className="-ml-1 flex min-h-11 cursor-pointer items-center gap-2 rounded-button pr-2 transition-opacity duration-200 ease-out hover:opacity-80"
          >
            {brand}
          </Link>
        ) : (
          <span className="-ml-1 flex min-h-11 items-center gap-2 pr-2">{brand}</span>
        )}
        {children}
      </div>
    </header>
  )
}
