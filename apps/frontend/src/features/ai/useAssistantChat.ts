import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/services/client'
import type { AiDraft } from '@/types/api'
import { AI_QUOTA_KEY } from './hooks'
import { streamChat } from './sse'
import { aiStrings } from './strings'

export type ChatItem = {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  draft?: AiDraft | null
  /** Câu trả lời đang được nhận dần */
  streaming?: boolean
  stopped?: boolean
  error?: string
}

let counter = 0
const nextId = () => `local-${++counter}`

/** Trạng thái cuộc trò chuyện đang diễn ra: gửi câu hỏi, nhận chữ dần, dừng giữa chừng. */
export function useAssistantChat() {
  const queryClient = useQueryClient()
  const [items, setItems] = useState<ChatItem[]>([])
  const [streaming, setStreaming] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)

  // Rời trang thì hủy luồng đang mở
  useEffect(() => () => controllerRef.current?.abort(), [])

  const patch = useCallback((id: string, change: (item: ChatItem) => ChatItem) => {
    setItems((all) => all.map((item) => (item.id === id ? change(item) : item)))
  }, [])

  const send = useCallback(
    async (text: string) => {
      const message = text.trim()
      if (!message || controllerRef.current) return

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
        await streamChat(
          message,
          {
            onToken: (chunk) => patch(replyId, (item) => ({ ...item, content: item.content + chunk })),
            onDraft: (draft) => patch(replyId, (item) => ({ ...item, draft })),
            onDone: (quota) => queryClient.setQueryData(AI_QUOTA_KEY, quota),
          },
          controller.signal,
        )
        patch(replyId, (item) => ({ ...item, streaming: false }))
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
    [patch, queryClient],
  )

  const stop = useCallback(() => controllerRef.current?.abort(), [])

  return { items, streaming, send, stop }
}
