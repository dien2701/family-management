import { ShieldAlert, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { areaOf } from '@/features/auth/routing'
import { useAuth } from '@/hooks/useAuth'
import { JoinFamilyForm } from '../components/JoinFamilyForm'
import { familyStrings as s } from '../strings'

// Mở từ link mời `/moi/:code`. Route nằm sau RequireAuth nên người chưa đăng nhập được chuyển tới đăng nhập/đăng ký
// (kèm `from`) rồi quay lại đây để tham gia.
export function InvitePage() {
  const { code = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  // Chốt khu vực lúc mở trang: tham gia xong claim đổi sang "family" thì vẫn giữ form cho tới khi chuyển trang, khỏi nháy
  const [initialArea] = useState(() => (user ? areaOf(user) : null))
  if (!user || !initialArea) return null

  const area = initialArea
  if (area !== 'onboarding') {
    const isAdmin = area === 'admin'
    return (
      <EmptyState
        icon={ShieldAlert}
        title={isAdmin ? s.invite.adminTitle : s.invite.alreadyMember}
        description={isAdmin ? s.invite.adminDescription : s.invite.alreadyMemberDescription}
        action={
          <Button variant="secondary" onClick={() => void navigate(isAdmin ? '/quan-tri' : '/')}>
            {isAdmin ? s.invite.toAdmin : s.invite.toHome}
          </Button>
        }
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-fg">
          <UsersRound className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl leading-tight font-bold md:text-2xl">{s.invite.title}</h2>
          <p className="mt-2 text-text-muted">{s.invite.description}</p>
        </div>
      </div>
      <section className="rounded-card border border-border bg-surface p-4 shadow-card md:p-6">
        {/* Tham gia xong token được làm mới; route guard không bao phủ trang này nên tự chuyển về app chính */}
        <JoinFamilyForm initialCode={code} onJoined={() => void navigate('/', { replace: true })} />
      </section>
    </div>
  )
}
