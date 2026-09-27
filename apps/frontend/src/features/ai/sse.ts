// Đọc Server-Sent Events của `POST /api/ai/chat` bằng fetch + ReadableStream (EventSource không gửi được
// header Bearer hay body). Gặp 401 thì refresh một lần rồi thử lại, giống `services/client.ts`.
import { ApiError, api, getAccessToken, refreshSession, type ProblemDetail } from '@/services/client'
import type { AiDraft, AiQuota } from '@/types/api'

export type ChatHandlers = {
  onToken: (text: string) => void
  onDraft: (draft: AiDraft) => void
  onDone: (quota: AiQuota) => void
}

export type SseEvent = { event: string; data: string }

/** Tách một khối SSE (các dòng `event:` và `data:`); khối chỉ có chú thích hoặc rỗng thì trả `null`. */
export function parseSseBlock(block: string): SseEvent | null {
  let event = 'message'
  const data: string[] = []
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith(':')) continue
    const sep = line.indexOf(':')
    const field = sep === -1 ? line : line.slice(0, sep)
    const value = sep === -1 ? '' : line.slice(sep + 1).replace(/^ /, '')
    if (field === 'event') event = value
    else if (field === 'data') data.push(value)
  }
  return data.length === 0 ? null : { event, data: data.join('\n') }
}

function dispatch({ event, data }: SseEvent, handlers: ChatHandlers) {
  let payload: unknown
  try {
    payload = JSON.parse(data)
  } catch {
    return
  }
  if (event === 'token') handlers.onToken((payload as { text?: string }).text ?? '')
  else if (event === 'draft') handlers.onDraft(payload as AiDraft)
  else if (event === 'done') handlers.onDone(payload as AiQuota)
  else if (event === 'error') {
    const { code, message } = payload as { code?: string; message?: string }
    throw new ApiError(500, { code, detail: message })
  }
}

async function post(message: string, signal: AbortSignal): Promise<Response> {
  const send = () => {
    const token = getAccessToken()
    return fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ message }),
      credentials: 'same-origin',
      signal,
    })
  }
  const sentToken = getAccessToken()
  try {
    let response = await send()
    if (response.status === 401) {
      // Token đã được lời gọi khác đổi trong lúc chờ thì thử lại luôn, khỏi refresh thêm lần nữa
      const refreshed =
        getAccessToken() !== sentToken && getAccessToken() !== null
          ? true
          : (await refreshSession()) !== null
      if (refreshed) response = await send()
    }
    return response
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    if (cause instanceof ApiError) throw cause
    throw new ApiError(0, { title: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.' })
  }
}

/** Gửi câu hỏi và gọi handler mỗi khi có chữ, bản nháp hoặc kết thúc. Hủy bằng `signal`. */
export async function streamChat(
  message: string,
  handlers: ChatHandlers,
  signal: AbortSignal,
): Promise<void> {
  // Chế độ giả lập: handler trả 503 "Cần kết nối máy chủ" (điều kiện viết trực tiếp để Vite cắt khỏi bản prod)
  if (import.meta.env.DEV && import.meta.env.VITE_API_MODE === 'mock') {
    await api.post('/ai/chat', { message }, { signal })
    return
  }

  const response = await post(message, signal)
  if (!response.ok) {
    let problem: ProblemDetail = {}
    try {
      problem = (await response.json()) as ProblemDetail
    } catch {
      // Body rỗng hoặc không phải JSON
    }
    throw new ApiError(response.status, problem)
  }
  if (!response.body) throw new ApiError(0, { title: 'Máy chủ không trả về luồng dữ liệu.' })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      const blocks = buffer.split(/\r?\n\r?\n/)
      buffer = done ? '' : (blocks.pop() ?? '')
      for (const block of blocks) {
        const parsed = parseSseBlock(block)
        if (parsed) dispatch(parsed, handlers)
      }
      if (done) break
    }
  } finally {
    reader.cancel().catch(() => undefined)
  }
}
