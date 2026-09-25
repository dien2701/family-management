import type { MemberSummary } from '@/types/api'
import { initialOf } from '@/utils/text'

/** "Sinh 1950 · Mất 2001 · Đời 3"; chưa biết gì thì rỗng. */
function memberMetaText(member: MemberSummary): string {
  const parts: string[] = []
  if (member.birthYear != null) parts.push(`Sinh ${member.birthYear}`)
  if (member.isDeceased) parts.push(member.deathYear != null ? `Mất ${member.deathYear}` : 'Đã mất')
  if (member.generation != null) parts.push(`Đời ${member.generation}`)
  return parts.join(' · ')
}

/** Ảnh (hoặc chữ cái đầu), họ tên ghi nguyên văn và dòng phụ của một thành viên; dùng trong danh sách chọn. */
export function MemberIdentity({ member }: { member: MemberSummary }) {
  const meta = memberMetaText(member)
  return (
    <span className="flex min-w-0 items-center gap-3">
      {member.avatarUrl ? (
        <img src={member.avatarUrl} alt="" className="size-10 shrink-0 rounded-full object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-semibold text-secondary-fg"
        >
          {initialOf(member.fullName)}
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-semibold [overflow-wrap:anywhere]">{member.fullName}</span>
        {meta && <span className="block text-sm text-text-muted">{meta}</span>}
      </span>
    </span>
  )
}
