import { Phone, Mail, MapPin } from 'lucide-react'
import type { MemberDetail } from '@/types/api'
import { Badge } from '@/components/shared/Badge'
import { memberStrings } from '../strings'

export function MemberProfileCard({ member }: { member: MemberDetail }) {
  const { detail: str } = memberStrings

  // Format birth
  const birthStr = [member.birthDay, member.birthMonth, member.birthYear]
    .filter(Boolean)
    .join('/')

  // Format death (âm kèm dương)
  let deathStr = ''
  if (member.deathLunarDay && member.deathLunarMonth) {
    deathStr += `${member.deathLunarDay.toString().padStart(2, '0')}/${member.deathLunarMonth.toString().padStart(2, '0')}`
    if (member.deathLunarLeap) deathStr += ' (nhuận)'
    deathStr += ' âm lịch'
  }
  
  const solarDeath = [member.deathDay, member.deathMonth, member.deathYear]
    .filter(Boolean)
    .join('/')
    
  if (solarDeath) {
    if (deathStr) deathStr += ` (${solarDeath})`
    else deathStr += solarDeath
  }

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
              {birthStr && <span>{str.born}: {birthStr}</span>}
              {member.isDeceased && deathStr && <span>{str.died}: {deathStr}</span>}
              {member.generation && <span>{str.generation}: {member.generation}</span>}
            </div>
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
