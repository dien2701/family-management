import { LayoutDashboard, Users, UserCheck, UserMinus, ArrowRight, ShieldAlert, CalendarHeart, CalendarDays, Flame, Cake, Loader2, Network, ScrollText, Sparkles, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { useAuth } from '@/hooks/useAuth'
import { useDashboard } from '../hooks'
import type { CalendarOccurrence } from '@/types/api'
import { daysLabel, dualDateLine } from '@/features/calendar/format'
import { prayerStrings } from '@/features/prayer/strings'
import { isApproved } from '@/features/auth/routing'
import { dashboardStrings as t } from '../strings'

type QuickLink = { to: string; label: string; description: string; icon: LucideIcon }

// Bài khấn và các trang xem công khai ai cũng vào được; Trợ lý AI cần tài khoản đã duyệt nên chỉ thêm khi đủ quyền.
function quickLinksFor(approved: boolean): QuickLink[] {
  const links: QuickLink[] = [
    { to: '/thanh-vien', icon: Users, ...t.member },
    { to: '/cay', icon: Network, ...t.tree },
    { to: '/lich', icon: CalendarDays, ...t.event },
    { to: '/bai-khan', icon: ScrollText, label: prayerStrings.menu, description: prayerStrings.menuDescription },
  ]
  if (approved) links.push({ to: '/tro-ly', icon: Sparkles, ...t.assistant })
  return links
}

function QuickLinkTile({ to, label, description, icon: Icon }: QuickLink) {
  return (
    <Link
      to={to}
      className="bg-surface rounded-card p-4 shadow-card border border-border flex flex-col items-start gap-3 min-h-[44px] cursor-pointer transition-colors duration-200 ease-out hover:bg-surface-muted last:odd:col-span-2 lg:last:odd:col-span-1"
    >
      <span className="p-3 rounded-full bg-secondary text-secondary-fg">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-18 font-semibold">{label}</span>
        <span className="block text-14 text-text-muted">{description}</span>
      </span>
    </Link>
  )
}

function EventIcon({ type }: { type: CalendarOccurrence['type'] }) {
  if (type === 'MEMORIAL') return <Flame className="w-5 h-5 text-event-memorial" />
  if (type === 'BIRTHDAY') return <Cake className="w-5 h-5 text-event-birthday" />
  return <CalendarHeart className="w-5 h-5 text-event-custom" />
}

function EventCard({ event, title }: { event: CalendarOccurrence; title: string }) {
  return (
    <div className="bg-primary text-primary-fg rounded-card shadow-card p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div>
        <h3 className="text-18 font-semibold mb-1">{title}</h3>
        <div className="flex items-center gap-2">
          <EventIcon type={event.type} />
          <span className="text-16">{event.title}</span>
        </div>
        <div className="text-14 mt-1 opacity-80">
          {dualDateLine(event)}
        </div>
      </div>
      <div className="bg-surface/20 rounded-card px-4 py-3 text-center min-w-[120px]">
        <div className="text-32 font-bold tabular-nums leading-tight">
          {event.daysUntil === 0 ? 'Hôm nay' : event.daysUntil}
        </div>
        {event.daysUntil !== 0 && <div className="text-14 opacity-80">ngày nữa</div>}
      </div>
    </div>
  )
}

const PAGE_SIZE = 5

// Danh sách đã xếp gần nhất trước (BE), FE chỉ cắt trang nên trang đầu luôn là 5 sự kiện gần nhất
function EventListCard({ title, empty, events, dayLabel, dayClass }: {
  title: string
  empty: string
  events: CalendarOccurrence[]
  dayLabel: (event: CalendarOccurrence) => string
  dayClass: string
}) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(events.length / PAGE_SIZE)
  const shown = events.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="bg-surface rounded-card shadow-card border border-border overflow-hidden">
      <h3 className="text-16 font-semibold p-4 bg-surface-muted border-b border-border">{title}</h3>
      {events.length === 0 ? (
        <div className="p-8 text-center text-text-muted text-14">{empty}</div>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {shown.map((event, idx) => (
              <li key={idx} className="p-4 flex items-center justify-between gap-3 hover:bg-surface-muted transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <EventIcon type={event.type} />
                  <div className="min-w-0">
                    <div className="font-medium text-16 text-text">{event.title}</div>
                    <div className="text-14 text-text-muted">{dualDateLine(event)}</div>
                  </div>
                </div>
                <div className={`text-14 tabular-nums shrink-0 ${dayClass}`}>{dayLabel(event)}</div>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="p-3 border-t border-border">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatTile({ title, value, icon: Icon, colorClass }: { title: string, value: number, icon: LucideIcon, colorClass?: string }) {
  return (
    <div className="bg-surface rounded-card p-3 sm:p-4 shadow-card border border-border flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
      <div className={`p-3 rounded-full bg-surface-muted ${colorClass || 'text-text-muted'}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-14 text-text-muted">{title}</div>
        <div className="text-32 font-bold tabular-nums text-text leading-tight">{value}</div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading } = useDashboard()
  const links = quickLinksFor(isApproved(user))

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) return null

  if (data.maxGeneration === 0 && data.totalMembers === 0) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="Gia phả trống"
        description="Hãy bắt đầu bằng cách thêm thành viên đầu tiên vào cây."
        action={<Button asChild><Link to="/cay">Tới Cây gia phả</Link></Button>}
      />
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-8">
      {/* Admin Pending Tasks */}
      {user?.systemRole === 'ADMIN' && ((data.pendingAccounts ?? 0) > 0 || (data.pendingLinkRequests ?? 0) > 0) && (
        <div className="bg-warning-bg border border-warning/20 rounded-card p-4 shadow-card">
          <div className="flex items-center gap-2 mb-4 text-warning">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-18 font-semibold">Cần quản trị viên xử lý</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {(data.pendingAccounts ?? 0) > 0 && (
              <Link to="/quan-tri/tai-khoan" className="flex-1 bg-surface p-3 rounded-field border border-warning/30 flex items-center justify-between hover:bg-surface-muted transition-colors">
                <div>
                  <div className="text-14 text-text-muted">Tài khoản chờ duyệt</div>
                  <div className="text-24 font-bold tabular-nums text-warning">{data.pendingAccounts}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-warning/50" />
              </Link>
            )}
            {(data.pendingLinkRequests ?? 0) > 0 && (
              <Link to="/quan-tri/yeu-cau-lien-ket" className="flex-1 bg-surface p-3 rounded-field border border-warning/30 flex items-center justify-between hover:bg-surface-muted transition-colors">
                <div>
                  <div className="text-14 text-text-muted">Yêu cầu liên kết</div>
                  <div className="text-24 font-bold tabular-nums text-warning">{data.pendingLinkRequests}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-warning/50" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Lối vào các trang chính: điện thoại 2 cột (ô lẻ cuối kéo giãn), laptop một hàng */}
      <nav aria-label="Lối vào nhanh" className={`grid grid-cols-2 gap-3 ${links.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
        {links.map((link) => <QuickLinkTile key={link.to} {...link} />)}
      </nav>

      {/* Thẻ số liệu */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatTile title="Thành viên" value={data.totalMembers} icon={Users} />
        <StatTile title="Còn sống" value={data.living} icon={UserCheck} colorClass="text-success" />
        <StatTile title="Đã mất" value={data.deceased} icon={UserMinus} colorClass="text-deceased" />
      </div>

      {/* Sự kiện sắp tới (Next event highlight) */}
      {data.nextEvent && (
        <EventCard event={data.nextEvent} title="Sự kiện sắp tới" />
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <EventListCard
          title="Sắp tới (30 ngày)"
          empty="Không có sự kiện nào trong 30 ngày tới"
          events={data.upcoming30}
          dayLabel={(e) => (e.daysUntil === 0 ? 'Hôm nay' : `Còn ${e.daysUntil} ngày`)}
          dayClass="font-medium text-accent"
        />
        <EventListCard
          title="Mới diễn ra"
          empty="Chưa có sự kiện nào gần đây"
          events={data.recentEvents}
          dayLabel={(e) => daysLabel(e.daysUntil)}
          dayClass="text-text-muted"
        />
      </div>
    </div>
  )
}
