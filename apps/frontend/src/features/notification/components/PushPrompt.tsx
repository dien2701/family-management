import { BellRing, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { enablePush, getPushState, needsHomeScreenInstall, syncPush, type PushState } from '../push'

const DISMISS_KEY = 'giapha.pushPromptDismissed'

const wasDismissed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/** Mời bật thông báo đẩy: quyền chỉ xin được khi người dùng bấm, nên cần một nút rõ ràng ngay khi vào app. */
export function PushPrompt() {
  const [state, setState] = useState<PushState | null>(null)
  const [dismissed, setDismissed] = useState(wasDismissed)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void syncPush().then(() => getPushState()).then(setState)
  }, [])

  const homeScreen = needsHomeScreenInstall()
  const show = !dismissed && (state === 'off' || (state === 'unsupported' && homeScreen))
  if (!show) return null

  const enable = async () => {
    setBusy(true)
    setError(null)
    try {
      await enablePush()
      setState('on')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không bật được thông báo.')
      setState(await getPushState())
    } finally {
      setBusy(false)
    }
  }

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Không lưu được thì lần sau hiện lại, không sao
    }
  }

  return (
    <div role="status" className="mb-4 flex items-start gap-3 rounded-field bg-secondary px-4 py-3 text-secondary-fg">
      <BellRing className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Nhận nhắc giỗ, sinh nhật và sự kiện ngay trên điện thoại</p>
        <p className="text-base">
          {state === 'unsupported'
            ? 'Trên iPhone: bấm nút Chia sẻ, chọn "Thêm vào Màn hình chính", rồi mở ứng dụng từ biểu tượng đó để bật thông báo.'
            : 'Thông báo hiện lên cả khi bạn không mở ứng dụng.'}
        </p>
        {error && <p className="mt-1 text-danger">{error}</p>}
        {state === 'off' && (
          <Button className="mt-2" onClick={() => void enable()} disabled={busy}>
            Bật thông báo
          </Button>
        )}
      </div>
      <Button variant="ghost" size="icon" aria-label="Để sau" onClick={dismiss}>
        <X aria-hidden="true" />
      </Button>
    </div>
  )
}
