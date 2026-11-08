import { LayoutDashboard, Users, UserCheck, UserMinus, ArrowRight, ShieldAlert, CalendarHeart, CalendarDays, CalendarClock, CalendarRange, History, Flame, Cake, Loader2, Network, ScrollText, Sparkles, ChartColumn, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { IconTile } from '@/components/shared/IconTile'
import { ListGroup, ListRow } from '@/components/shared/ListRow'
import { Pagination } from '@/components/shared/Pagination'
import { SectionCard } from '@/components/shared/SectionCard'
import { useAuth } from '@/hooks/useAuth'
import { useDashboard } from '../hooks'
import type { CalendarOccurrence } from '@/types/api'
import { daysLabel, dualDateLine } from '@/features/calendar/format'
import { OccurrenceDetailDialog } from '@/features/calendar/components/OccurrenceDetailDialog'
import { prayerStrings } from '@/features/prayer/strings'
import { dashboardStrings as t } from '../strings'

// Lối tắt tới các trang xem công khai ai cũng vào được (DECISIONS #88, #90, #91). Cây và Sự kiện đã có nút ở thẻ chào.
const SHORTCUTS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/thanh-vien', icon: Users, label: t.member },
  { to: '/bai-khan', icon: ScrollText, label: prayerStrings.menu },
  { to: '/tro-ly', icon: Sparkles, label: t.assistant },
  { to: '/them/doi-lich', icon: CalendarRange, label: t.lunar },
]

function EventIcon({ type }: { type: CalendarOccurrence['type'] }) {
  if (type === 'MEMORIAL') return <Flame className="size-5 shrink-0 text-event-memorial" aria-hidden="true" />
  if (type === 'BIRTHDAY') return <Cake className="size-5 shrink-0 text-event-birthday" aria-hidden="true" />
  return <CalendarHeart className="size-5 shrink-0 text-event-custom" aria-hidden="true" />
}

// Thẻ chào không ảnh (DECISIONS #96): lời chào, sự kiện gần nhất (bấm để xem chi tiết), nút Xem cây và Xem sự kiện
function GreetingCard({ name, guest, event }: { name?: string; guest: boolean; event?: CalendarOccurrence }) {
  const [open, setOpen] = useState(false)
  return (
    <section
      aria-labelledby="greeting-title"
      className="rounded-card border border-border bg-linear-to-br from-hero-from to-hero-to p-5 shadow-card md:p-6"
    >
      <h2 id="greeting-title" className="text-2xl leading-tight font-bold text-primary">
        {name ? `${t.hello}, ${name}` : t.hello}
      </h2>
      <p className="mt-1 text-text-muted">{guest ? t.welcomeGuest : t.welcomeUser}</p>

      {event ? (
        // Cả khối là một nút: tên sự kiện to bên trái, ô đếm ngày nền đậm bên phải
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${t.eventDetail}: ${event.title}`}
          className="group mt-4 flex w-full cursor-pointer items-center gap-3 rounded-field border border-border bg-surface p-3 text-left shadow-card transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-sm font-medium text-text-muted">
              <EventIcon type={event.type} />
              {t.nextEvent}
            </span>
            <span className="mt-1 block text-lg leading-snug font-bold text-text group-hover:text-primary">{event.title}</span>
            <span className="mt-0.5 block text-sm text-text-muted">{dualDateLine(event)}</span>
          </span>
          <span className="flex min-w-18 shrink-0 flex-col items-center justify-center self-stretch rounded-field bg-primary px-3 py-2 text-primary-fg">
            {event.daysUntil === 0 ? (
              <span className="text-lg leading-tight font-bold">Hôm nay</span>
            ) : (
              <>
                <span className="text-3xl leading-none font-bold tabular-nums">{event.daysUntil}</span>
                <span className="mt-1 text-sm">ngày nữa</span>
              </>
            )}
          </span>
        </button>
      ) : (
        <div className="mt-4 rounded-field border border-border bg-surface p-3">
          <p className="text-sm font-medium text-text-muted">{t.nextEvent}</p>
          <p className="mt-1 text-text">{t.noNextEvent}</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 md:flex">
        <Button asChild>
          <Link to="/cay">
            <Network aria-hidden="true" />
            {t.viewTree}
          </Link>
        </Button>
        <Button asChild variant="secondary" className="bg-surface hover:bg-surface-muted">
          <Link to="/lich">
            <CalendarDays aria-hidden="true" />
            {t.viewEvents}
          </Link>
        </Button>
      </div>

      <OccurrenceDetailDialog occurrence={open && event ? event : null} onClose={() => setOpen(false)} />
    </section>
  )
}

const PAGE_SIZE = 5

// Danh sách đã xếp gần nhất trước (BE), FE chỉ cắt trang nên trang đầu luôn là 5 sự kiện gần nhất
function EventListCard({ title, icon, empty, events, dayLabel, dayClass }: {
  title: string
  icon: LucideIcon
  empty: string
  events: CalendarOccurrence[]
  dayLabel: (event: CalendarOccurrence) => string
  dayClass: string
}) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(events.length / PAGE_SIZE)
  const shown = events.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <SectionCard title={title} icon={icon} moreTo="/lich">
      {events.length === 0 ? (
        <p className="py-6 text-center text-text-muted">{empty}</p>
      ) : (
        <>
          <ListGroup>
            {shown.map((event, idx) => (
              <ListRow
                key={idx}
                leading={<EventIcon type={event.type} />}
                label={event.title}
                description={dualDateLine(event)}
                trailing={<span className={`shrink-0 text-sm tabular-nums ${dayClass}`}>{dayLabel(event)}</span>}
              />
            ))}
          </ListGroup>
          {totalPages > 1 && (
            <div className="mt-2 border-t border-border pt-3">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </>
      )}
    </SectionCard>
  )
}

function StatTile({ title, value, icon: Icon, colorClass }: { title: string, value: number, icon: LucideIcon, colorClass?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-field bg-surface-muted p-3 text-center sm:flex-row sm:gap-3 sm:text-left">
      <Icon className={`size-6 shrink-0 ${colorClass || 'text-text-muted'}`} aria-hidden="true" />
      <div>
        <div className="text-sm text-text-muted">{title}</div>
        <div className="text-2xl leading-tight font-bold text-text tabular-nums md:text-3xl">{value}</div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading } = useDashboard()

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
    <div className="max-w-[1200px] mx-auto space-y-4 pb-8 md:space-y-6">
      <GreetingCard name={user?.fullName} guest={!user} event={data.nextEvent} />

      {/* Việc chờ Admin xử lý */}
      {user?.systemRole === 'ADMIN' && ((data.pendingAccounts ?? 0) > 0 || (data.pendingLinkRequests ?? 0) > 0) && (
        <div className="bg-warning-bg border border-warning/20 rounded-card p-4 shadow-card">
          <div className="flex items-center gap-2 mb-4 text-warning">
            <ShieldAlert className="size-5" aria-hidden="true" />
            <h2 className="text-lg font-bold">Cần quản trị viên xử lý</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {(data.pendingAccounts ?? 0) > 0 && (
              <Link to="/quan-tri/tai-khoan" className="flex-1 bg-surface p-3 rounded-field border border-warning/30 flex items-center justify-between hover:bg-surface-muted transition-colors">
                <div>
                  <div className="text-sm text-text-muted">Tài khoản chờ duyệt</div>
                  <div className="text-2xl font-bold tabular-nums text-warning">{data.pendingAccounts}</div>
                </div>
                <ArrowRight className="size-5 text-warning/50" aria-hidden="true" />
              </Link>
            )}
            {(data.pendingLinkRequests ?? 0) > 0 && (
              <Link to="/quan-tri/yeu-cau-lien-ket" className="flex-1 bg-surface p-3 rounded-field border border-warning/30 flex items-center justify-between hover:bg-surface-muted transition-colors">
                <div>
                  <div className="text-sm text-text-muted">Yêu cầu liên kết</div>
                  <div className="text-2xl font-bold tabular-nums text-warning">{data.pendingLinkRequests}</div>
                </div>
                <ArrowRight className="size-5 text-warning/50" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      )}

      <SectionCard title={t.shortcuts}>
        <nav aria-label={t.shortcuts} className="grid grid-cols-4 gap-2">
          {SHORTCUTS.map((link) => <IconTile key={link.to} {...link} />)}
        </nav>
      </SectionCard>

      <SectionCard title={t.stats} icon={ChartColumn}>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatTile title="Thành viên" value={data.totalMembers} icon={Users} />
          <StatTile title="Còn sống" value={data.living} icon={UserCheck} colorClass="text-success" />
          <StatTile title="Đã mất" value={data.deceased} icon={UserMinus} colorClass="text-deceased" />
        </div>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <EventListCard
          title="Sắp tới (30 ngày)"
          icon={CalendarClock}
          empty="Không có sự kiện nào trong 30 ngày tới"
          events={data.upcoming30}
          dayLabel={(e) => (e.daysUntil === 0 ? 'Hôm nay' : `Còn ${e.daysUntil} ngày`)}
          dayClass="font-medium text-accent-text"
        />
        <EventListCard
          title="Mới diễn ra"
          icon={History}
          empty="Chưa có sự kiện nào gần đây"
          events={data.recentEvents}
          dayLabel={(e) => daysLabel(e.daysUntil)}
          dayClass="text-text-muted"
        />
      </div>
    </div>
  )
}
