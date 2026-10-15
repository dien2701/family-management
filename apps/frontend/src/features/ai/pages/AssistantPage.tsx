import { Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { Alert } from '@/components/shared/Alert'
import { EmptyState } from '@/components/shared/EmptyState'
import { isApproved } from '@/features/auth/routing'
import { useAuth } from '@/hooks/useAuth'
import { ChatMessage } from '../components/ChatMessage'
import { Composer } from '../components/Composer'
import { useAiMessages, useAiQuota } from '../hooks'
import { aiStrings } from '../strings'
import { useAssistantChat, type ChatItem } from '../useAssistantChat'

const formatResetDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

export function AssistantPage() {
  const { user } = useAuth()
  // Khách và tài khoản chưa duyệt dùng được Trợ lý nhưng không có lịch sử và bản nháp (DECISIONS #91)
  const guest = !isApproved(user)
  const suggestions = guest
    ? aiStrings.suggestions
    : [...aiStrings.suggestions, aiStrings.draftSuggestion]
  const quota = useAiQuota()
  const history = useAiMessages(!guest)
  const { items, streaming, send, stop } = useAssistantChat(guest)
  const endRef = useRef<HTMLDivElement>(null)

  const past: ChatItem[] = (history.data ?? []).map((m) => ({
    id: `history-${m.id}`,
    role: m.role,
    content: m.content,
    draft: m.draft,
  }))
  const all = [...past, ...items]

  // Chữ hiện dần thì kéo xuống cuối để luôn thấy phần mới nhất
  const lastContent = all.at(-1)?.content
  useEffect(() => {
    if (all.length > 0) endRef.current?.scrollIntoView({ block: 'end' })
  }, [all.length, lastContent])

  const remaining = quota.data?.remaining
  const outOfQuota = remaining !== undefined && remaining <= 0
  const hint =
    quota.data === undefined
      ? null
      : guest && quota.data.limit === 0
        ? aiStrings.guestOff
        : outOfQuota
          ? aiStrings.quotaOut(formatResetDate(quota.data.resetAt))
          : aiStrings.quotaLeft(quota.data.remaining)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {guest && (
        <p className="text-sm text-text-muted">
          {user ? aiStrings.guestPendingNote : aiStrings.guestNote}{' '}
          {!user && (
            <Link
              to="/dang-nhap"
              state={{ from: '/tro-ly' }}
              className="inline-flex min-h-11 items-center font-medium text-primary underline"
            >
              {aiStrings.guestLogin}
            </Link>
          )}
        </p>
      )}
      {history.isError && <Alert>{aiStrings.historyError}</Alert>}

      <div
        role="log"
        aria-live="polite"
        aria-label={aiStrings.title}
        className="flex min-h-[40dvh] flex-col gap-4"
      >
        {all.length === 0 && !history.isLoading ? (
          <EmptyState
            icon={Sparkles}
            title={aiStrings.emptyTitle}
            description={aiStrings.emptyDescription}
            action={
              <ul
                aria-label={aiStrings.suggestionsLabel}
                className="flex flex-wrap justify-center gap-2"
              >
                {suggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      disabled={outOfQuota || streaming}
                      onClick={() => void send(suggestion)}
                      className="min-h-11 cursor-pointer rounded-full bg-secondary px-4 py-2 text-left text-base font-medium text-secondary-fg transition-colors duration-200 ease-out hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            }
          />
        ) : (
          all.map((item) => <ChatMessage key={item.id} item={item} />)
        )}
        <div ref={endRef} />
      </div>

      <Composer
        streaming={streaming}
        disabled={outOfQuota}
        hint={hint}
        onSend={(text) => void send(text)}
        onStop={stop}
      />
    </div>
  )
}
