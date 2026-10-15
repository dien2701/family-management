import { Mic, MicOff, SendHorizontal, Square } from 'lucide-react'
import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { aiStrings } from '../strings'
import { useSpeechInput } from '../useSpeechInput'

type ComposerProps = {
  streaming: boolean
  /** Hết lượt hôm nay: khóa ô nhập */
  disabled: boolean
  /** Dòng phụ dưới ô nhập: số lượt còn lại hoặc giờ reset */
  hint: string | null
  onSend: (text: string) => void
  onStop: () => void
}

const MAX_LENGTH = 1000

// Dính ở đáy trang. Trên điện thoại nằm ngay trên thanh điều hướng dưới (cao ~72px + vùng an toàn);
// chữ 16px để iOS không tự phóng to khi bấm vào ô.
export function Composer({ streaming, disabled, hint, onSend, onStop }: ComposerProps) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  const hintId = useId()
  const canSend = !disabled && !streaming && text.trim().length > 0

  const resize = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }

  // Nói xong thì chữ nằm trong ô nhập để người dùng xem lại rồi mới bấm Gửi (DECISIONS #92)
  const voiceBaseRef = useRef('')
  const voice = useSpeechInput((transcript) => {
    const base = voiceBaseRef.current.trimEnd()
    const joined = base && transcript ? `${base} ${transcript}` : base || transcript
    setText(joined.slice(0, MAX_LENGTH))
    requestAnimationFrame(resize)
  })
  const toggleVoice = () => {
    if (voice.listening) {
      voice.stop()
      return
    }
    voiceBaseRef.current = text
    voice.start()
  }
  const status = voice.error ?? (voice.listening ? aiStrings.voiceListening : hint)

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!canSend) return
    voice.stop()
    onSend(text)
    setText('')
    // Đặt lại chiều cao sau khi React xóa nội dung
    requestAnimationFrame(resize)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter gửi, Shift+Enter xuống dòng; bỏ qua khi đang gõ tiếng Việt bằng bộ gõ (IME)
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form
      onSubmit={submit}
      className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 -mx-4 border-t border-border bg-surface px-4 pt-3 pb-3 md:bottom-0 md:mx-0 md:rounded-card md:border md:shadow-card"
    >
      <div className="flex items-end gap-2">
        <label htmlFor={`${hintId}-input`} className="sr-only">
          {aiStrings.inputLabel}
        </label>
        <Textarea
          id={`${hintId}-input`}
          ref={ref}
          rows={1}
          value={text}
          maxLength={MAX_LENGTH}
          disabled={disabled}
          placeholder={aiStrings.inputPlaceholder}
          aria-describedby={status ? hintId : undefined}
          onChange={(event) => {
            setText(event.target.value)
            resize()
          }}
          onKeyDown={onKeyDown}
          className="max-h-32 min-h-11 flex-1 resize-none py-2.5"
        />
        {voice.supported && (
          <Button
            type="button"
            variant={voice.listening ? 'primary' : 'secondary'}
            size="icon"
            disabled={disabled || streaming}
            aria-pressed={voice.listening}
            aria-label={voice.listening ? aiStrings.voiceStop : aiStrings.voiceStart}
            title={voice.listening ? aiStrings.voiceStop : aiStrings.voiceStart}
            onClick={toggleVoice}
            className={voice.listening ? 'motion-safe:animate-pulse' : undefined}
          >
            {voice.listening ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
          </Button>
        )}
        {streaming ? (
          <Button type="button" variant="secondary" onClick={onStop} aria-label={aiStrings.stop}>
            <Square aria-hidden="true" />
            <span className="hidden sm:inline">{aiStrings.stop}</span>
          </Button>
        ) : (
          <Button type="submit" disabled={!canSend} aria-label={aiStrings.send}>
            <SendHorizontal aria-hidden="true" />
            <span className="hidden sm:inline">{aiStrings.send}</span>
          </Button>
        )}
      </div>
      {status && (
        <p
          id={hintId}
          role={voice.error ? 'alert' : undefined}
          className="mt-2 text-sm text-text-muted tabular-nums"
        >
          {status}
        </p>
      )}
    </form>
  )
}
