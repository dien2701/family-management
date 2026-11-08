import { FileDown, Files, FileText, Settings, ShieldCheck, Sparkles, UserCheck, UserCog, ScrollText, ArrowLeftRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { IconTile } from '@/components/shared/IconTile'
import { SectionCard } from '@/components/shared/SectionCard'
import { adminStrings } from '@/features/admin/strings'
import { aiStrings } from '@/features/ai/strings'
import { AccountCard } from '@/features/auth/components/AccountCard'
import { LogoutButton } from '@/features/auth/components/LogoutButton'
import { isAdmin } from '@/features/auth/routing'
import { linkStrings } from '@/features/link/strings'
import { prayerStrings } from '@/features/prayer/strings'
import { InstallAppItem } from '@/features/pwa/components/InstallAppItem'
import { useAuth } from '@/hooks/useAuth'

type Item = { to: string; label: string; icon: LucideIcon }

const UTILITIES: Item[] = [
  { to: '/tro-ly', label: aiStrings.menu, icon: Sparkles },
  { to: '/bai-khan', label: prayerStrings.menu, icon: ScrollText },
  { to: '/them/doi-lich', label: 'Đổi lịch âm – dương', icon: ArrowLeftRight },
  { to: '/them/xuat-du-lieu', label: 'Xuất dữ liệu', icon: FileDown },
]

const FAMILY: Item[] = [
  { to: '/them/toi-la-ai', label: linkStrings.menu, icon: UserCheck },
  { to: '/de-xuat', label: 'Đề xuất của tôi', icon: FileText },
  { to: '/them/tai-lieu-chung', label: 'Tài liệu chung', icon: Files },
]

const OTHER: Item[] = [
  { to: '/cai-dat', label: 'Cài đặt', icon: Settings },
  { to: '/chinh-sach-bao-mat', label: 'Chính sách bảo mật', icon: ShieldCheck },
]

function Tiles({ items, children }: { items: Item[]; children?: ReactNode }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {children}
      {items.map((item) => (
        <IconTile key={item.to} boxed {...item} />
      ))}
    </div>
  )
}

// Tab Thêm (DESIGN §9): thẻ tài khoản ở đầu, các mục chia nhóm thành lưới ô 4 cột; Quản trị chỉ Admin thấy
// (trên điện thoại thanh dưới chỉ có 5 mục nên Quản trị vào từ đây; Sidebar và rail có mục riêng)
export function MorePage() {
  const { user } = useAuth()
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <AccountCard />
      <nav aria-label="Các mục khác" className="flex flex-col gap-4">
        <SectionCard title="Tiện ích">
          <Tiles items={UTILITIES} />
        </SectionCard>
        <SectionCard title="Gia đình">
          <Tiles items={FAMILY} />
        </SectionCard>
        {isAdmin(user) && (
          <SectionCard title={adminStrings.menu}>
            <Tiles items={[{ to: '/quan-tri', label: adminStrings.menu, icon: UserCog }]} />
          </SectionCard>
        )}
        <SectionCard title="Khác">
          <Tiles items={OTHER}>
            <InstallAppItem />
          </Tiles>
        </SectionCard>
      </nav>
      <LogoutButton className="w-full md:w-auto" />
    </div>
  )
}
