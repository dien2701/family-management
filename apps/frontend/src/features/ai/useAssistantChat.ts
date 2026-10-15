import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/services/client'
import type { AiDraft } from '@/types/api'
import { aiApi } from './api'
import { AI_CONVERSATIONS_KEY, AI_QUOTA_KEY } from './hooks'
import { streamChat, type ChatTurn } from './sse'
import { aiStrings } from './strings'

export type ChatItem = {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  draft?: AiDraft | null
  /** Câu trả lời đang được nhận dần */
  streaming?: boolean
  /** Việc Trợ lý đang làm (đang tra cứu...), chỉ hiện khi chưa có chữ nào */
  status?: string
  stopped?: boolean
  error?: string
}

let counter = 0
const nextId = () => `local-${++counter}`

const MAX_HISTORY = 10

/** Vài lượt gần nhất của phiên để khách có ngữ cảnh (server không lưu lịch sử của khách, DECISIONS #91). */
function toHistory(items: ChatItem[]): ChatTurn[] {
  const turns = items
    .filter((item) => item.content && !item.error && !item.streaming)
    .map((item): ChatTurn => ({ role: item.role === 'USER' ? 'user' : 'model', text: item.content }))
    .slice(-MAX_HISTORY)
  return turns[0]?.role === 'model' ? turns.slice(1) : turns
}

/**
 * Trạng thái đoạn chat đang mở: gửi câu hỏi, nhận chữ dần, dừng giữa chừng, mở đoạn khác (DECISIONS #94).
 * `guest`: khách hoặc tài khoản chưa duyệt, chỉ có một phiên trong bộ nhớ và gửi kèm lịch sử vì server không lưu.
 * `conversationId` là `null` ở đoạn mới chưa gửi câu nào: server tạo đoạn khi nhận câu đầu rồi báo id về.
 */
export function useAssistantChat(guest: boolean) {
  const queryClient = useQueryClient()
  const [items, setItems] = useState<ChatItem[]>([])
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)
  // Đoạn đang muốn xem: bỏ kết quả tải của đoạn đã bị đổi sang đoạn khác
  const wantedRef = useRef<number | null>(null)

  // Rời trang thì hủy luồng đang mở
  useEffect(() => () => controllerRef.current?.abort(), [])

  const patch = useCallback((id: string, change: (item: ChatItem) => ChatItem) => {
    setItems((all) => all.map((item) => (item.id === id ? change(item) : item)))
  }, [])

  /** Mở đoạn đã có (tải tin từ server) hoặc `null` để bắt đầu đoạn mới. Không đổi được khi đang trả lời. */
  const open = useCallback(
    async (id: number | null) => {
      if (controllerRef.current) return
      wantedRef.current = id
      setConversationId(id)
      setItems([])
      setLoadError(false)
      if (id === null) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const messages = await aiApi.messages(id)
        if (wantedRef.current !== id) return
        setItems(
          messages.map((m) => ({
            id: `history-${m.id}`,
            role: m.role,
            content: m.content,
            draft: m.draft,
          })),
        )
      } catch {
        if (wantedRef.current === id) setLoadError(true)
      } finally {
        if (wantedRef.current === id) setLoading(false)
      }
    },
    [],
  )

  const send = useCallback(
    async (text: string) => {
      const message = text.trim()
      if (!message || controllerRef.current || loading) return

      const history = guest ? toHistory(items) : []
      const replyId = nextId()
      setItems((all) => [
        ...all,
        { id: nextId(), role: 'USER', content: message },
        { id: replyId, role: 'ASSISTANT', content: '', streaming: true },
      ])
      const controller = new AbortController()
      controllerRef.current = controller
      setStreaming(true)

      try {
        // Chữ nào nhận được là hiện ngay (DECISIONS #92), không đệm giả lập
        await streamChat(
          message,
          history,
          guest ? null : conversationId,
          {
            onToken: (chunk) => patch(replyId, (item) => ({ ...item, content: item.content + chunk })),
            onStatus: (status) => patch(replyId, (item) => ({ ...item, status })),
            onDraft: (draft) => patch(replyId, (item) => ({ ...item, draft })),
            onConversation: (conversation) => {
              wantedRef.current = conversation.id
              setConversationId(conversation.id)
            },
            onDone: (quota) => queryClient.setQueryData(AI_QUOTA_KEY, quota),
          },
          controller.signal,
        )
        patch(replyId, (item) => ({ ...item, streaming: false }))
        // Đoạn vừa có tin mới: lên đầu danh sách (hoặc mới xuất hiện)
        void queryClient.invalidateQueries({ queryKey: AI_CONVERSATIONS_KEY })
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          patch(replyId, (item) => ({ ...item, streaming: false, stopped: true }))
        } else {
          const messageText = error instanceof ApiError ? error.message : aiStrings.genericError
          patch(replyId, (item) => ({ ...item, streaming: false, error: messageText }))
          // Có thể do hết lượt hoặc lượt vừa bị trừ: lấy lại số lượt thật
          void queryClient.invalidateQueries({ queryKey: AI_QUOTA_KEY })
        }
      } finally {
        controllerRef.current = null
        setStreaming(false)
      }
    },
    [conversationId, guest, items, loading, patch, queryClient],
  )

  const stop = useCallback(() => controllerRef.current?.abort(), [])

  return { items, conversationId, streaming, loading, loadError, open, send, stop }
}
