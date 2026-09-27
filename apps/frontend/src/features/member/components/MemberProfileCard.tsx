import { Phone, Mail, MapPin, UserCheck } from 'lucide-react'
import type { MemberDetail } from '@/types/api'
import { Badge } from '@/components/shared/Badge'
import { formatSolar } from '@/utils/lunar'
import { memberStrings } from '../strings'

type Birth = MemberDetail['birth']
type LunarDeath = MemberDetail['deathLunar']

const pad = (n: number) => String(n).padStart(2, '0')

/** "15/06/1950", "1950" (chỉ năm) hoặc "15/06/1950 âm lịch". */
function birthText(birth: Birth): string {
  if (!birth) return ''
  const parts = [
    birth.day != null ? pad(birth.day) : null,
    birth.month != null ? pad(birth.month) : null,
    birth.year != null ? String(birth.year) : null,
  ].filter(Boolean)
  if (!parts.length) return ''
  const leap = birth.calendar === 'LUNAR' && birth.leap ? ' (nhuận)' : ''
  return `${parts.join('/')}${leap}${birth.calendar === 'LUNAR' ? ` ${memberStrings.detail.calendarSuffix.lunar}` : ''}`
}

/** Ngày mất âm (năm có thể vắng) kèm ngày dương nếu có. */
function deathText(lunar: LunarDeath, solar: MemberDetail['deathSolar']): string {
  const solarText = solar ? formatSolar(solar) : ''
  if (!lunar) return solarText
  const lunarText =
    `${pad(lunar.day)}/${pad(lunar.month)}${lunar.year != null ? `/${lunar.year}` : ''}` +
    `${lunar.leap ? ' (nhuận)' : ''} ${memberStrings.detail.calendarSuffix.lunar}`
  return solarText ? `${lunarText} (${solarText})` : lunarText
}

type MemberProfileCardProps = {
  member: MemberDetail
  /** Hồ sơ này là của tài khoản đang đăng nhập (đã liên kết "Tôi là ai"). */
  isSelf?: boolean
}

export function MemberProfileCard({ member, isSelf = false }: MemberProfileCardProps) {
  const { detail: str } = memberStrings
  const birthStr = birthText(member.birth)
  const deathStr = deathText(member.deathLunar, member.deathSolar)

  return (
    <div className="rounded-card border border-primary bg-primary text-primary-fg shadow-card overflow-hidden">
      <div className="p-4 md:p-6 relative">
        {member.isDeceased && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6">
            <Badge tone="warning">Đã mất</Badge>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-4 items-center md:items-start text-center md:text-left">
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt="" className="size-20 md:size-24 rounded-card object-cover bg-surface" />
          ) : (
            <div className="flex size-20 md:size-24 shrink-0 items-center justify-center rounded-card bg-surface text-primary font-bold text-3xl">
              {member.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div className="flex-1 mt-2 md:mt-0">
            <h1 className="text-xl md:text-2xl font-bold leading-tight">{member.fullName}</h1>
            
            <div className="mt-3 flex flex-col gap-1.5 text-primary-fg/90 text-sm md:text-base">
              {member.gender ? (
                <span>{str.gender[member.gender as 'M' | 'F']}</span>
              ) : (
                <span>{str.gender.unknown}</span>
              )}
              {member.tabooName && <span>{str.tabooName}: {member.tabooName}</span>}
              {birthStr && <span>{str.born}: {birthStr}</span>}
              {member.isDeceased && deathStr && <span>{str.died}: {deathStr}</span>}
              {member.generation && <span>{str.generation}: {member.generation}</span>}
            </div>
            {(isSelf || member.labels.length > 0) && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5 md:justify-start">
                {isSelf && (
                  <Badge tone="success" className="gap-1">
                    <UserCheck className="size-4" aria-hidden="true" />
                    {str.you}
                  </Badge>
                )}
                {member.labels.map((label) => (
                  <Badge key={label} tone="neutral">{label}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Contact & Info Links */}
      {(member.phone || member.email || member.burialPlace) && (
        <div className="bg-surface p-4 flex flex-col gap-3 text-text border-t border-border">
          {member.phone && (
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-fg">
                <Phone className="size-4" />
              </div>
              <span>{member.phone}</span>
            </div>
          )}
          {member.email && (
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-fg">
                <Mail className="size-4" />
              </div>
              <span>{member.email}</span>
            </div>
          )}
          {member.burialPlace && (
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-fg">
                <MapPin className="size-4" />
              </div>
              <span>{member.burialPlace}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
