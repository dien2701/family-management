import {
  ArrowLeftRight,
  FileDown,
  Files,
  FileText,
  LayoutGrid,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserCog,
  Users,
  ScrollText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ListGroup, ListRow } from '@/components/shared/ListRow'
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

type Item = { to: string; label: string; description: string; icon: LucideIcon }

const UTILITIES: Item[] = [
  { to: '/tro-ly', label: aiStrings.menu, description: aiStrings.menuDescription, icon: Sparkles },
  {
    to: '/bai-khan',
    label: prayerStrings.menu,
    description: prayerStrings.menuDescription,
    icon: ScrollText,
  },
  {
    to: '/them/doi-lich',
    label: 'Đổi lịch âm – dương',
    description: 'Tra ngày âm lịch và dương lịch tương ứng',
    icon: ArrowLeftRight,
  },
  {
    to: '/them/xuat-du-lieu',
    label: 'Xuất dữ liệu',
    description: 'Tải báo cáo thành viên, sự kiện và lịch giỗ',
    icon: FileDown,
  },
]

const FAMILY: Item[] = [
  {
    to: '/them/toi-la-ai',
    label: linkStrings.menu,
    description: linkStrings.menuDescription,
    icon: UserCheck,
  },
  {
    to: '/de-xuat',
    label: 'Đề xuất của tôi',
    description: 'Quản lý các đề xuất thay đổi sự kiện',
    icon: FileText,
  },
  {
    to: '/them/tai-lieu-chung',
    label: 'Tài liệu chung',
    description: 'Các tài liệu, biểu mẫu chung của gia đình',
    icon: Files,
  },
]

const OTHER: Item[] = [
  { to: '/cai-dat', label: 'Cài đặt', description: 'Giao diện, cỡ chữ, thông báo', icon: Settings },
  {
    to: '/chinh-sach-bao-mat',
    label: 'Chính sách bảo mật',
    description: 'Dữ liệu được thu thập và sử dụng ra sao',
    icon: ShieldCheck,
  },
]

function Rows({ items }: { items: Item[] }) {
  return items.map(({ to, label, description, icon }) => (
    <ListRow key={to} to={to} icon={icon} label={label} description={description} />
  ))
}

// Tab Thêm (DESIGN §9): thẻ tài khoản ở đầu, các mục chia nhóm; Quản trị chỉ Admin thấy
// (trên điện thoại thanh dưới chỉ có 5 mục nên Quản trị vào từ đây; Sidebar và rail có mục riêng)
export function MorePage() {
  const { user } = useAuth()
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <AccountCard />
      <nav aria-label="Các mục khác" className="flex flex-col gap-4">
        <SectionCard title="Tiện ích" icon={LayoutGrid}>
          <ListGroup>
            <Rows items={UTILITIES} />
          </ListGroup>
        </SectionCard>
        <SectionCard title="Gia đình" icon={Users}>
          <ListGroup>
            <Rows items={FAMILY} />
          </ListGroup>
        </SectionCard>
        {isAdmin(user) && (
          <SectionCard title={adminStrings.menu} icon={UserCog}>
            <ListGroup>
              <ListRow
                to="/quan-tri"
                icon={UserCog}
                label={adminStrings.menu}
                description={adminStrings.menuDescription}
              />
            </ListGroup>
          </SectionCard>
        )}
        <SectionCard title="Khác" icon={MoreHorizontal}>
          <ListGroup>
            <InstallAppItem />
            <Rows items={OTHER} />
          </ListGroup>
        </SectionCard>
      </nav>
      <LogoutButton className="w-full md:w-auto" />
    </div>
  )
}
