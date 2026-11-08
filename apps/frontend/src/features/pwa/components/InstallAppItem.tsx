import { Download, MonitorSmartphone, Share, PlusSquare, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ListRow } from '@/components/shared/ListRow'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: string }>
}

const detectStandalone = () =>
  (typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches) ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true

const detectIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)

export function InstallAppItem() {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null)
  const [isIOS] = useState(detectIOS)
  const [showIOSInstruction, setShowIOSInstruction] = useState(false)
  const [isStandalone] = useState(detectStandalone)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as InstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstruction(true)
      return
    }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    }
  }

  if (isStandalone) return null
  if (!deferredPrompt && !isIOS) return null

  return (
    <>
      <ListRow
        icon={Download}
        label="Cài đặt ứng dụng"
        description="Cài ứng dụng vào màn hình chính để truy cập nhanh"
        onClick={() => void handleInstallClick()}
        trailing={
          <MonitorSmartphone className="size-5 shrink-0 text-text-muted" aria-hidden="true" />
        }
      />

      {showIOSInstruction && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-surface w-full max-w-sm rounded-card shadow-overlay overflow-hidden relative">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-18">Cài đặt trên iOS</h3>
              <button
                onClick={() => setShowIOSInstruction(false)}
                className="p-2 -mr-2 text-text-muted hover:text-text rounded-full hover:bg-surface-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-text-muted text-16">
                Để cài đặt ứng dụng vào màn hình chính, vui lòng làm theo các bước sau:
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-secondary text-secondary-fg w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex items-center gap-2 text-16">
                    Nhấn vào biểu tượng <Share className="w-5 h-5 text-accent" /> ở dưới cùng màn
                    hình
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-secondary text-secondary-fg w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex items-center gap-2 text-16">
                    Chọn <PlusSquare className="w-5 h-5 text-text" />{' '}
                    <strong>Thêm vào MH chính</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-surface-muted border-t border-border flex justify-end">
              <button
                onClick={() => setShowIOSInstruction(false)}
                className="px-4 py-2 bg-primary text-primary-fg rounded-button font-medium hover:bg-primary-hover transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
