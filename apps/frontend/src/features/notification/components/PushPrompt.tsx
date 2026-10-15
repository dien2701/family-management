import { BellRing, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { enablePush, getPushState, needsHomeScreenInstall, syncPush, type PushMode, type PushState } from '../push'
import { guestPushStrings as s } from '../strings'

const DISMISS_KEY = 'giapha.pushPromptDismissed'

const wasDismissed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Mời bật thông báo đẩy: quyền chỉ xin được khi người dùng bấm, nên cần một nút rõ ràng ngay khi vào app.
 * `mode="guest"` cho khách và tài khoản chưa duyệt (DECISIONS #89): không cần đăng nhập, kèm lối tới trang tùy chỉnh.
 * Đổi `mode` (đăng nhập, đăng xuất) thì đồng bộ lại để subscription của thiết bị chuyển đúng chủ.
 */
export function PushPrompt({ mode }: { mode: PushMode }) {
  const [state, setState] = useState<PushState | null>(null)
  const [dismissed, setDismissed] = useState(wasDismissed)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void syncPush(mode).then(() => getPushState()).then(setState)
  }, [mode])

  const homeScreen = needsHomeScreenInstall()
  const show = !dismissed && (state === 'off' || (state === 'unsupported' && homeScreen))
  if (!show) return null

  const enable = async () => {
    setBusy(true)
    setError(null)
    try {
      await enablePush(mode)
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
        <p className="font-semibold">{s.prompt.title}</p>
        <p className="text-base">{state === 'unsupported' ? s.iosInstall : s.prompt.body}</p>
        {error && <p className="mt-1 text-danger">{error}</p>}
        {state === 'off' && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button onClick={() => void enable()} disabled={busy}>
              Bật thông báo
            </Button>
            {mode === 'guest' && (
              <Button asChild variant="ghost">
                <Link to="/thong-bao-thiet-bi">{s.prompt.customize}</Link>
              </Button>
            )}
          </div>
        )}
      </div>
      <Button variant="ghost" size="icon" aria-label={s.prompt.later} onClick={dismiss}>
        <X aria-hidden="true" />
      </Button>
    </div>
  )
}
