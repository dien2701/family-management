import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { prayerStrings } from '../strings'

type ReaderModeProps = { title: string; text: string; onClose: () => void }

/**
 * Đọc bài toàn màn hình, chữ lớn (DECISIONS #90). Giữ màn hình sáng bằng Wake Lock nếu trình duyệt hỗ trợ.
 * Dùng <dialog> gốc để có sẵn khóa focus và đóng bằng Esc; chỉ dựng khi đang mở.
 */
export function ReaderMode({ title, text, onClose }: ReaderModeProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open && typeof dialog.showModal === 'function') dialog.showModal()
  }, [])

  // Khóa cuộn nền
  useEffect(() => {
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = previous
    }
  }, [])

  // Giữ màn hình sáng. Trình duyệt tự nhả khóa khi tab bị ẩn nên xin lại khi hiện trở lại.
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let stopped = false
    const acquire = async () => {
      try {
        const next = await navigator.wakeLock.request('screen')
        if (stopped) void next.release()
        else lock = next
      } catch {
        // Bị từ chối (pin yếu, tab nền): vẫn đọc được, chỉ là màn hình có thể tự tắt
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire()
    }
    void acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-0 h-dvh max-h-none w-dvw max-w-none overflow-y-auto bg-surface p-0 text-text"
    >
      <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 px-4 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))] md:px-8">
        <div className="sticky top-0 flex items-start justify-between gap-3 bg-surface py-2">
          <h2 id={titleId} className="text-xl leading-tight font-bold md:text-2xl">
            {title}
          </h2>
          <Button variant="secondary" onClick={onClose} className="shrink-0">
            <X aria-hidden="true" />
            {prayerStrings.detail.readerClose}
          </Button>
        </div>
        <p className="text-2xl leading-loose whitespace-pre-wrap md:text-3xl md:leading-loose">{text}</p>
      </div>
    </dialog>
  )
}
