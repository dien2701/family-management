import { ChevronRight, ShieldCheck, TreeDeciduous } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { AccountCard } from '@/features/auth/components/AccountCard'

const ITEMS: { to: string; label: string; description: string; icon: LucideIcon }[] = [
  {
    to: '/them/dong-ho',
    label: 'Dòng họ',
    description: 'Thông tin, tài khoản và mã mời',
    icon: TreeDeciduous,
  },
  {
    to: '/chinh-sach-bao-mat',
    label: 'Chính sách bảo mật',
    description: 'Dữ liệu được thu thập và sử dụng ra sao',
    icon: ShieldCheck,
  },
]

// Thẻ tài khoản + Đăng xuất (Đợt 3), mục Dòng họ (Đợt 5); các mục khác được thêm ở các đợt sau
export function MorePage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <AccountCard />
      <nav aria-label="Các mục khác">
        <ul className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          {ITEMS.map(({ to, label, description, icon: Icon }) => (
            <li key={to} className="border-b border-border last:border-b-0">
              <Link
                to={to}
                className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors duration-200 ease-out hover:bg-surface-muted"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-fg">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{label}</span>
                  <span className="block text-sm text-text-muted">{description}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
