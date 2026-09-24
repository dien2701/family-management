import { KeyRound, TreeDeciduous } from 'lucide-react'
import { useId, useState } from 'react'
import { LogoutButton } from '@/features/auth/components/LogoutButton'
import { cn } from '@/utils/cn'
import { CreateFamilyForm } from '../components/CreateFamilyForm'
import { JoinFamilyForm } from '../components/JoinFamilyForm'
import { familyStrings as s } from '../strings'

type Tab = 'join' | 'create'

const TABS: { id: Tab; label: string; icon: typeof KeyRound }[] = [
  { id: 'join', label: s.onboarding.tabJoin, icon: KeyRound },
  { id: 'create', label: s.onboarding.tabCreate, icon: TreeDeciduous },
]

// Người dùng chưa thuộc family: tham gia bằng mã mời hoặc tạo dòng họ mới. Cả hai đều phải đồng ý chính sách.
export function OnboardingPage() {
  const [tab, setTab] = useState<Tab>('join')
  const baseId = useId()

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div>
        <h2 className="text-xl leading-tight font-bold md:text-2xl">{s.onboarding.title}</h2>
        <p className="mt-2 text-text-muted">{s.onboarding.description}</p>
      </div>

      <section className="rounded-card border border-border bg-surface p-4 shadow-card md:p-6">
        <div
          role="tablist"
          aria-label={s.onboarding.tabsLabel}
          className="grid grid-cols-2 gap-1 rounded-field bg-surface-muted p-1"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`${baseId}-panel`}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => setTab(id)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  const next = tab === 'join' ? 'create' : 'join'
                  setTab(next)
                  document.getElementById(`${baseId}-tab-${next}`)?.focus()
                }
              }}
              className={cn(
                'flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-button px-2 text-base font-semibold transition-colors duration-200 ease-out',
                tab === id
                  ? 'bg-secondary text-secondary-fg'
                  : 'text-text-muted hover:bg-secondary-hover hover:text-text',
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-tab-${tab}`}
          className="mt-6"
        >
          {tab === 'join' ? <JoinFamilyForm /> : <CreateFamilyForm />}
        </div>
      </section>

      <div className="flex justify-center">
        <LogoutButton />
      </div>
    </div>
  )
}
