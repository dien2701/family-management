// Nhập câu hỏi bằng giọng nói qua Web Speech API của trình duyệt (DECISIONS #92). Âm thanh do Google/Apple xử lý,
// không đi qua máy chủ của ứng dụng. Firefox không hỗ trợ: `supported = false` thì giao diện ẩn nút micro.
import { useCallback, useEffect, useRef, useState } from 'react'

// lib.dom chưa có kiểu cho Web Speech API nên khai báo phần tối thiểu đang dùng
type SpeechResultList = ArrayLike<ArrayLike<{ transcript: string }>>
type SpeechEvent = { results: SpeechResultList }
type SpeechErrorEvent = { error: string }
type Recognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: SpeechEvent) => void) | null
  onerror: ((event: SpeechErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type RecognitionConstructor = new () => Recognition

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor
    webkitSpeechRecognition?: RecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** Mã lỗi của Web Speech API → thông báo tiếng Việt; lỗi bị bỏ qua (người dùng tự dừng) thì trả null. */
function describeError(code: string): string | null {
  switch (code) {
    case 'aborted':
      return null
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Trình duyệt chưa được cấp quyền dùng micro. Hãy cho phép micro cho trang này rồi thử lại.'
    case 'no-speech':
      return 'Không nghe thấy giọng nói. Bạn thử nói lại nhé.'
    case 'audio-capture':
      return 'Không tìm thấy micro trên thiết bị này.'
    case 'network':
      return 'Không kết nối được dịch vụ nhận dạng giọng nói. Kiểm tra mạng rồi thử lại.'
    default:
      return 'Chưa nhận dạng được giọng nói. Bạn thử lại sau nhé.'
  }
}

/**
 * `onTranscript` nhận toàn bộ câu đã nghe được tính từ lúc bấm nói (cả phần đang nhận dạng dở), gọi nhiều lần
 * trong một lượt nói. Nói xong, nhận dạng tự dừng.
 */
export function useSpeechInput(onTranscript: (transcript: string) => void) {
  const [supported] = useState(() => recognitionConstructor() !== null)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<Recognition | null>(null)
  const callbackRef = useRef(onTranscript)

  useEffect(() => {
    callbackRef.current = onTranscript
  }, [onTranscript])

  // Rời trang thì tắt micro
  useEffect(() => () => recognitionRef.current?.abort(), [])

  const start = useCallback(() => {
    const Ctor = recognitionConstructor()
    if (!Ctor || recognitionRef.current) return
    const recognition = new Ctor()
    recognition.lang = 'vi-VN'
    recognition.interimResults = true
    recognition.continuous = false
    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i]?.[0]?.transcript ?? ''
      }
      callbackRef.current(transcript.trim())
    }
    recognition.onerror = (event) => setError(describeError(event.error))
    recognition.onend = () => {
      recognitionRef.current = null
      setListening(false)
    }
    setError(null)
    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
    } catch {
      // start() ném lỗi khi đang chạy dở hoặc trình duyệt từ chối
      recognitionRef.current = null
      setError(describeError('default'))
    }
  }, [])

  const stop = useCallback(() => recognitionRef.current?.stop(), [])

  return { supported, listening, error, start, stop }
}
