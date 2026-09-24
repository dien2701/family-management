import { useAuth } from '@/hooks/useAuth'
import { authStrings } from '../strings'
import { LogoutButton } from './LogoutButton'

export function AccountCard() {
  const { user } = useAuth()
  if (!user) return null
  return (
    <section
      aria-label={authStrings.account}
      className="mb-4 flex flex-col gap-4 rounded-card border border-border bg-surface p-4 shadow-card md:flex-row md:items-center md:justify-between md:p-6"
    >
      <div className="min-w-0">
        <p className="truncate text-lg leading-tight font-semibold">{user.fullName}</p>
        <p className="truncate text-text-muted">{user.email}</p>
      </div>
      <LogoutButton className="w-full md:w-auto" />
    </section>
  )
}
