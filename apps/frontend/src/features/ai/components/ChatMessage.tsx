import { Sparkles } from 'lucide-react'
import { Alert } from '@/components/shared/Alert'
import { cn } from '@/utils/cn'
import { aiStrings } from '../strings'
import type { ChatItem } from '../useAssistantChat'
import { DraftCard } from './DraftCard'
import { SafeMarkdown } from './SafeMarkdown'

// Câu hỏi của người dùng nằm bên phải (nền primary), câu trả lời của Trợ lý bên trái (thẻ trắng)
export function ChatMessage({ item }: { item: ChatItem }) {
  const mine = item.role === 'USER'
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('min-w-0', mine ? 'max-w-[85%]' : 'w-full max-w-[95%] md:max-w-[85%]')}>
        <p
          className={cn(
            'mb-1 flex items-center gap-1.5 text-sm text-text-muted',
            mine && 'justify-end',
          )}
        >
          {!mine && (
            <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-secondary-fg">
              <Sparkles aria-hidden="true" className="size-3.5" />
            </span>
          )}
          {mine ? aiStrings.you : aiStrings.assistant}
        </p>
        {mine ? (
          <p className="rounded-card bg-primary px-4 py-3 break-words whitespace-pre-wrap text-primary-fg">
            {item.content}
          </p>
        ) : (
          <div className="space-y-2">
            {(item.content || item.streaming) && (
              <div className="rounded-card border border-border bg-surface px-4 py-3 shadow-card">
                {item.content ? (
                  <SafeMarkdown text={item.content} />
                ) : (
                  <p className="text-text-muted">{item.status ?? aiStrings.thinking}</p>
                )}
                {item.streaming && item.content && (
                  <span
                    aria-hidden="true"
                    className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-accent align-middle"
                  />
                )}
                {item.stopped && (
                  <p className="mt-2 text-sm text-text-muted">{aiStrings.stopped}</p>
                )}
              </div>
            )}
            {!item.content && item.stopped && (
              <p className="text-sm text-text-muted">{aiStrings.stopped}</p>
            )}
            {item.error && <Alert>{item.error}</Alert>}
            {item.draft && <DraftCard draft={item.draft} />}
          </div>
        )}
      </div>
    </div>
  )
}
