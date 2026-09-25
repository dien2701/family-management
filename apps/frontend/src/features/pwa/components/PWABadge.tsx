import { useRegisterSW } from 'virtual:pwa-register/react'
import { useEffect, useState } from 'react'
import { WifiOff, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PWABadge() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)
    
    // Initial check
    if (typeof navigator !== 'undefined') {
      setOffline(!navigator.onLine)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  return (
    <>
      {offline && (
        <div className="bg-warning-bg text-warning text-14 p-2 text-center flex items-center justify-center gap-2 border-b border-warning/20">
          <WifiOff className="w-4 h-4" />
          <span>Đang offline — dữ liệu có thể cũ</span>
        </div>
      )}

      {needRefresh && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-surface text-text shadow-overlay border border-border p-4 rounded-card flex flex-col gap-3 z-50 min-w-[280px]">
          <div className="font-medium text-16 flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-accent" />
            Có bản cập nhật mới!
          </div>
          <div className="text-14 text-text-muted">
            Vui lòng tải lại trang để sử dụng phiên bản mới nhất.
          </div>
          <div className="flex gap-2 justify-end mt-1">
            <Button variant="ghost" onClick={() => setNeedRefresh(false)}>Đóng</Button>
            <Button onClick={() => updateServiceWorker(true)}>Tải lại</Button>
          </div>
        </div>
      )}
    </>
  )
}
