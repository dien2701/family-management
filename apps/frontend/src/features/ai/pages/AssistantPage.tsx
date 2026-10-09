import { Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Alert } from '@/components/shared/Alert'
import { EmptyState } from '@/components/shared/EmptyState'
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
  const quota = useAiQuota()
  const history = useAiMessages()
  const { items, streaming, send, stop } = useAssistantChat()
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
      : outOfQuota
        ? aiStrings.quotaOut(formatResetDate(quota.data.resetAt))
        : aiStrings.quotaLeft(quota.data.remaining)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {history.isError && <Alert>{aiStrings.historyError}</Alert>}

      <div
        role="log"
        aria-live="polite"
        aria-label={aiStrings.title}
        className="flex min-h-[40dvh] flex-col gap-4"
      >
        {all.length === 0 && !history.isPending ? (
          <EmptyState
            icon={Sparkles}
            title={aiStrings.emptyTitle}
            description={aiStrings.emptyDescription}
            action={
              <ul
                aria-label={aiStrings.suggestionsLabel}
                className="flex flex-wrap justify-center gap-2"
              >
                {aiStrings.suggestions.map((suggestion) => (
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
