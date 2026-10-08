import { Bell, Smartphone } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Alert } from '@/components/shared/Alert'
import { Button } from '@/components/ui/button'
import { useTestPush } from '../hooks'
import { disablePush, enablePush, getPushState, needsHomeScreenInstall, type PushState } from '../push'

const STATUS: Record<PushState, string> = {
  on: 'Đã bật trên thiết bị này',
  off: 'Chưa bật trên thiết bị này',
  denied: 'Đang bị chặn trong trình duyệt',
  unsupported: 'Thiết bị hoặc trình duyệt này chưa hỗ trợ',
}

/** Trạng thái thật của thông báo đẩy trên thiết bị này, kèm bật, tắt, gửi thử. */
export function PushCard() {
  const testPush = useTestPush()
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'success' | 'danger'; text: string } | null>(null)

  const refresh = useCallback(() => void getPushState().then(setState), [])
  useEffect(refresh, [refresh])

  const run = async (action: () => Promise<string>) => {
    setBusy(true)
    setMessage(null)
    try {
      setMessage({ kind: 'success', text: await action() })
    } catch (e) {
      setMessage({ kind: 'danger', text: e instanceof Error ? e.message : 'Có lỗi xảy ra.' })
    } finally {
      setBusy(false)
      refresh()
    }
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
        <Smartphone className="size-5" aria-hidden="true" /> Thông báo đẩy trên thiết bị này
      </h2>
      <p className="mb-1 text-base text-text-muted">
        Nhận nhắc lịch ngay trên màn hình, kể cả khi không mở ứng dụng. Mỗi thiết bị bật riêng.
      </p>
      <p className="mb-4 font-semibold" aria-live="polite">
        {state ? STATUS[state] : 'Đang kiểm tra…'}
      </p>

      {state === 'denied' && (
        <Alert variant="info" className="mb-4">
          Hãy bật lại quyền Thông báo cho trang này trong phần cài đặt của trình duyệt, rồi tải lại trang.
        </Alert>
      )}
      {state === 'unsupported' && needsHomeScreenInstall() && (
        <Alert variant="info" className="mb-4">
          Trên iPhone: bấm nút Chia sẻ, chọn "Thêm vào Màn hình chính", rồi mở ứng dụng từ biểu tượng đó.
        </Alert>
      )}
      {message && (
        <Alert variant={message.kind} className="mb-4">
          {message.text}
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {state === 'off' && (
          <Button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await enablePush()
                return 'Đã bật thông báo trên thiết bị này.'
              })
            }
          >
            <Bell aria-hidden="true" /> Bật thông báo
          </Button>
        )}
        {state === 'on' && (
          <>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await testPush.mutateAsync()
                  return 'Đã gửi thông báo thử. Kiểm tra màn hình thiết bị.'
                })
              }
            >
              Gửi thử
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await disablePush()
                  return 'Đã tắt thông báo trên thiết bị này.'
                })
              }
            >
              Tắt
            </Button>
          </>
        )}
      </div>
    </section>
  )
}
