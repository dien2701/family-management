import { LayoutDashboard, Users, UserCheck, UserMinus, TreeDeciduous, ArrowRight, ShieldAlert, CalendarHeart, Flame, Cake, Loader2 } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAuth } from '@/features/auth/hooks'
import { useDashboard } from '../hooks'
import type { CalendarOccurrence } from '@/types/api'
import { useMemo } from 'react'
import { formatDate } from '@/utils/lunar' // wait, verify utils/lunar or occurrences export

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
          Ngày {event.solar.day}/{event.solar.month}/{event.solar.year} dương
          {event.lunar ? ` (Tương đương ${event.lunar.day}/${event.lunar.month} âm)` : ''}
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

function StatTile({ title, value, icon: Icon, colorClass }: { title: string, value: number, icon: any, colorClass?: string }) {
  return (
    <div className="bg-surface rounded-card p-4 shadow-card border border-border flex items-center gap-4">
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
  const { role } = useAuth()
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
        action={{ label: "Tới Cây gia phả", href: "/cay" }}
      />
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-8">
      {/* Thẻ số liệu */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatTile title="Thành viên" value={data.totalMembers} icon={Users} />
        <StatTile title="Còn sống" value={data.living} icon={UserCheck} colorClass="text-success" />
        <StatTile title="Đã mất" value={data.deceased} icon={UserMinus} colorClass="text-deceased" />
        <StatTile title="Trên cây" value={data.onTree} icon={TreeDeciduous} colorClass="text-accent" />
        <StatTile title="Số đời" value={data.maxGeneration} icon={LayoutDashboard} />
      </div>

      {/* Admin Pending Tasks */}
      {role === 'ADMIN' && (data.pendingAccounts > 0 || data.pendingLinkRequests > 0) && (
        <div className="bg-warning-bg border border-warning/20 rounded-card p-4 shadow-card">
          <div className="flex items-center gap-2 mb-4 text-warning">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-18 font-semibold">Cần quản trị viên xử lý</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {data.pendingAccounts > 0 && (
              <Link to="/quan-tri/tai-khoan" className="flex-1 bg-surface p-3 rounded-field border border-warning/30 flex items-center justify-between hover:bg-surface-muted transition-colors">
                <div>
                  <div className="text-14 text-text-muted">Tài khoản chờ duyệt</div>
                  <div className="text-24 font-bold tabular-nums text-warning">{data.pendingAccounts}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-warning/50" />
              </Link>
            )}
            {data.pendingLinkRequests > 0 && (
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

      {/* Sự kiện sắp tới (Next event highlight) */}
      {data.nextEvent && (
        <EventCard event={data.nextEvent} title="Sự kiện sắp tới" />
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Trong 30 ngày tới */}
        <div className="bg-surface rounded-card shadow-card border border-border overflow-hidden">
          <h3 className="text-16 font-semibold p-4 bg-surface-muted border-b border-border">
            Sắp tới (30 ngày)
          </h3>
          <div className="p-0">
            {data.upcoming30.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-14">
                Không có sự kiện nào trong 30 ngày tới
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {data.upcoming30.map((event, idx) => (
                  <li key={idx} className="p-4 flex items-center justify-between hover:bg-surface-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <EventIcon type={event.type} />
                      <div>
                        <div className="font-medium text-16 text-text">{event.title}</div>
                        <div className="text-14 text-text-muted">Ngày {event.solar.day}/{event.solar.month}</div>
                      </div>
                    </div>
                    <div className="text-14 font-medium tabular-nums text-accent">
                      {event.daysUntil === 0 ? 'Hôm nay' : `Còn ${event.daysUntil} ngày`}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Mới diễn ra */}
        <div className="bg-surface rounded-card shadow-card border border-border overflow-hidden">
          <h3 className="text-16 font-semibold p-4 bg-surface-muted border-b border-border">
            Mới diễn ra
          </h3>
          <div className="p-0">
            {data.recentEvents.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-14">
                Chưa có sự kiện nào gần đây
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {data.recentEvents.map((event, idx) => (
                  <li key={idx} className="p-4 flex items-center justify-between hover:bg-surface-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <EventIcon type={event.type} />
                      <div>
                        <div className="font-medium text-16 text-text">{event.title}</div>
                        <div className="text-14 text-text-muted">Ngày {event.solar.day}/{event.solar.month}/{event.solar.year}</div>
                      </div>
                    </div>
                    <div className="text-14 text-text-muted tabular-nums">
                      {event.daysUntil} ngày trước
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
