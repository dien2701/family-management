import { Pencil, Pin, PinOff, Plus, Search, Trash2 } from 'lucide-react'
import { Alert } from '@/components/shared/Alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AiConversation } from '@/types/api'
import { cn } from '@/utils/cn'
import { aiStrings } from '../strings'

type ConversationListProps = {
  conversations: AiConversation[] | undefined
  loading: boolean
  error: boolean
  activeId: number | null
  query: string
  /** Đang nhận câu trả lời: khóa việc chuyển, tạo mới và sửa để khỏi mất câu đang chạy */
  busy: boolean
  onQuery: (value: string) => void
  onSelect: (id: number) => void
  onNew: () => void
  onTogglePin: (conversation: AiConversation) => void
  onRename: (conversation: AiConversation) => void
  onDelete: (conversation: AiConversation) => void
}

// Cột bên (desktop) và nội dung ngăn kéo (điện thoại) dùng chung. Nút thao tác hiện ở đoạn đang mở, hoặc khi
// rê chuột/focus vào hàng; trên cảm ứng thì mở đoạn rồi mới thao tác.
export function ConversationList({
  conversations,
  loading,
  error,
  activeId,
  query,
  busy,
  onQuery,
  onSelect,
  onNew,
  onTogglePin,
  onRename,
  onDelete,
}: ConversationListProps) {
  const searching = query.trim() !== ''
  return (
    <div className="flex min-h-0 flex-col gap-3">
      <Button onClick={onNew} disabled={busy} className="w-full">
        <Plus aria-hidden="true" />
        {aiStrings.conversations.new}
      </Button>

      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-text-muted"
        />
        <Input
          type="search"
          value={query}
          maxLength={100}
          aria-label={aiStrings.conversations.searchLabel}
          placeholder={aiStrings.conversations.searchPlaceholder}
          onChange={(event) => onQuery(event.target.value)}
          className="pl-10"
        />
      </div>

      {busy && <p className="text-sm text-text-muted">{aiStrings.conversations.busy}</p>}
      {error && <Alert>{aiStrings.conversations.loadError}</Alert>}

      {loading ? (
        <ul aria-hidden="true" className="flex flex-col gap-1">
          {[0, 1, 2].map((n) => (
            <li key={n} className="h-11 animate-pulse rounded-field bg-surface-muted" />
          ))}
        </ul>
      ) : conversations && conversations.length === 0 ? (
        <p className="px-1 py-4 text-center text-text-muted">
          {searching ? aiStrings.conversations.noResult : aiStrings.conversations.empty}
        </p>
      ) : (
        <ul className="flex min-h-0 flex-col gap-1 overflow-y-auto">
          {conversations?.map((c) => {
            const active = c.id === activeId
            return (
              <li key={c.id} className="group">
                <div
                  className={cn(
                    'flex items-center rounded-field transition-colors duration-200 ease-out',
                    active ? 'bg-secondary text-secondary-fg' : 'hover:bg-surface-muted',
                  )}
                >
                  <button
                    type="button"
                    aria-current={active ? 'true' : undefined}
                    disabled={busy}
                    onClick={() => onSelect(c.id)}
                    className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-field px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {c.pinned && (
                      <Pin
                        aria-label={aiStrings.conversations.pinned}
                        className="size-4 shrink-0 text-text-muted"
                      />
                    )}
                    <span className="line-clamp-2 min-w-0 text-base font-medium break-words">
                      {c.title}
                    </span>
                  </button>
                  <div
                    className={cn(
                      'shrink-0 items-center pr-1',
                      active ? 'flex' : 'hidden group-focus-within:flex group-hover:flex',
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={busy}
                      aria-pressed={c.pinned}
                      aria-label={c.pinned ? aiStrings.conversations.unpin : aiStrings.conversations.pin}
                      title={c.pinned ? aiStrings.conversations.unpin : aiStrings.conversations.pin}
                      onClick={() => onTogglePin(c)}
                    >
                      {c.pinned ? <PinOff aria-hidden="true" /> : <Pin aria-hidden="true" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={busy}
                      aria-label={aiStrings.conversations.rename}
                      title={aiStrings.conversations.rename}
                      onClick={() => onRename(c)}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={busy}
                      aria-label={aiStrings.conversations.remove}
                      title={aiStrings.conversations.remove}
                      onClick={() => onDelete(c)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {!searching && <p className="text-sm text-text-muted">{aiStrings.conversations.limitNote}</p>}
    </div>
  )
}
