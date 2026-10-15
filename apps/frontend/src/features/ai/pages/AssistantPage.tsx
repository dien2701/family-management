import { MessageSquarePlus, PanelLeftOpen, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Alert } from '@/components/shared/Alert'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { ModalDialog } from '@/components/shared/ModalDialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { isApproved } from '@/features/auth/routing'
import { useAuth } from '@/hooks/useAuth'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { ApiError } from '@/services/client'
import type { AiConversation } from '@/types/api'
import { ChatMessage } from '../components/ChatMessage'
import { Composer } from '../components/Composer'
import { ConversationList } from '../components/ConversationList'
import { RenameConversationDialog } from '../components/RenameConversationDialog'
import {
  useAiConversations,
  useAiQuota,
  useDeleteConversation,
  useUpdateConversation,
} from '../hooks'
import { aiStrings } from '../strings'
import { useAssistantChat } from '../useAssistantChat'

const formatResetDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

export function AssistantPage() {
  const { user } = useAuth()
  // Khách và tài khoản chưa duyệt dùng được Trợ lý nhưng chỉ có một phiên, không lịch sử và bản nháp (DECISIONS #91)
  const guest = !isApproved(user)
  const suggestions = guest
    ? aiStrings.suggestions
    : [...aiStrings.suggestions, aiStrings.draftSuggestion]
  const quota = useAiQuota()
  const { items, conversationId, streaming, loading, loadError, open, send, stop } =
    useAssistantChat(guest)
  const endRef = useRef<HTMLDivElement>(null)

  // Đoạn chat (DECISIONS #94): `all` luôn là danh sách đầy đủ (lấy tiêu đề đoạn đang mở, tự mở đoạn gần nhất);
  // đang tìm thì danh sách hiển thị là kết quả tìm.
  const [query, setQuery] = useState('')
  const term = useDebouncedValue(query.trim())
  const all = useAiConversations('', !guest)
  const found = useAiConversations(term, !guest && term !== '')
  const shown = term ? found : all
  const [drawer, setDrawer] = useState(false)
  const [renaming, setRenaming] = useState<AiConversation | null>(null)
  const [deleting, setDeleting] = useState<AiConversation | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const update = useUpdateConversation()
  const remove = useDeleteConversation()

  // Vào trang thì mở ngay đoạn gần nhất; người dùng đã chọn hoặc bấm "mới" trước khi danh sách về thì thôi
  const autoOpened = useRef(false)
  useEffect(() => {
    if (guest || autoOpened.current || !all.data) return
    autoOpened.current = true
    const latest = all.data[0]
    if (latest) void open(latest.id)
  }, [guest, all.data, open])

  const select = (id: number) => {
    autoOpened.current = true
    setDrawer(false)
    void open(id)
  }
  const startNew = () => {
    autoOpened.current = true
    setDrawer(false)
    void open(null)
  }
  const togglePin = (c: AiConversation) =>
    update.mutate(
      { id: c.id, pinned: !c.pinned },
      { onError: () => toast({ title: aiStrings.conversations.actionError }) },
    )
  const confirmDelete = () => {
    if (!deleting) return
    remove.mutate(deleting.id, {
      onSuccess: () => {
        if (deleting.id === conversationId) void open(null)
        setDeleting(null)
      },
      onError: (e) =>
        setDeleteError(e instanceof ApiError ? e.message : aiStrings.conversations.actionError),
    })
  }
  const askDelete = (c: AiConversation) => {
    setDeleteError(null)
    setDeleting(c)
  }

  const activeTitle =
    all.data?.find((c) => c.id === conversationId)?.title ?? aiStrings.newChatTitle

  // Chữ hiện dần thì kéo xuống cuối để luôn thấy phần mới nhất
  const lastContent = items.at(-1)?.content
  useEffect(() => {
    if (items.length > 0) endRef.current?.scrollIntoView({ block: 'end' })
  }, [items.length, lastContent])

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

  const list = (
    <ConversationList
      conversations={shown.data}
      loading={shown.isLoading}
      error={shown.isError}
      activeId={conversationId}
      query={query}
      busy={streaming}
      onQuery={setQuery}
      onSelect={select}
      onNew={startNew}
      onTogglePin={togglePin}
      onRename={setRenaming}
      onDelete={askDelete}
    />
  )
  // Đoạn trống chưa gửi câu nào thì không có gì để "mới" thêm
  const emptyChat = items.length === 0 && conversationId === null

  return (
    <div className="mx-auto flex w-full max-w-5xl items-start gap-6">
      {!guest && (
        <aside
          aria-label={aiStrings.conversations.title}
          className="sticky top-20 hidden max-h-[calc(100dvh-7rem)] w-72 shrink-0 flex-col rounded-card border border-border bg-surface p-3 shadow-card lg:flex"
        >
          {list}
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-4">
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

        <div className="flex items-center gap-2">
          {!guest && (
            <Button
              variant="secondary"
              size="icon"
              className="lg:hidden"
              aria-label={aiStrings.conversations.openList}
              onClick={() => setDrawer(true)}
            >
              <PanelLeftOpen aria-hidden="true" />
            </Button>
          )}
          <h2 className="min-w-0 flex-1 truncate text-lg font-semibold md:text-xl">
            {guest ? aiStrings.title : activeTitle}
          </h2>
          <Button
            variant="secondary"
            disabled={streaming || emptyChat}
            title={guest ? aiStrings.guestNewChat : undefined}
            className={guest ? undefined : 'lg:hidden'}
            onClick={startNew}
          >
            <MessageSquarePlus aria-hidden="true" />
            <span className="hidden sm:inline">{aiStrings.conversations.new}</span>
            <span className="sr-only sm:hidden">{aiStrings.conversations.new}</span>
          </Button>
        </div>

        {loadError && <Alert>{aiStrings.historyError}</Alert>}

        <div
          role="log"
          aria-live="polite"
          aria-label={aiStrings.title}
          className="flex min-h-[40dvh] flex-col gap-4"
        >
          {items.length === 0 && !loading && !loadError ? (
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
            items.map((item) => <ChatMessage key={item.id} item={item} />)
          )}
          {loading && (
            <p className="py-8 text-center text-text-muted" aria-busy="true">
              {aiStrings.conversations.loadingChat}
            </p>
          )}
          <div ref={endRef} />
        </div>

        <Composer
          streaming={streaming}
          disabled={outOfQuota || loading}
          hint={hint}
          onSend={(text) => void send(text)}
          onStop={stop}
        />
      </div>

      {!guest && (
        <ModalDialog
          open={drawer}
          title={aiStrings.conversations.title}
          onClose={() => setDrawer(false)}
        >
          {list}
        </ModalDialog>
      )}
      <RenameConversationDialog conversation={renaming} onClose={() => setRenaming(null)} />
      <ConfirmDialog
        open={deleting !== null}
        title={aiStrings.conversations.deleteTitle}
        description={aiStrings.conversations.deleteDescription(deleting?.title ?? '')}
        confirmLabel={aiStrings.conversations.deleteConfirm}
        cancelLabel={aiStrings.conversations.cancel}
        danger
        loading={remove.isPending}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
