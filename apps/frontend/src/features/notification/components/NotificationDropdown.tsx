import { formatDateTime } from '@/utils/date'
import { Check, Settings } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useNotifications, useReadAllNotifications, useReadNotification } from '../hooks'
import { useEffect, useRef } from 'react'

type Props = {
  onClose: () => void
}

export function NotificationDropdown({ onClose }: Props) {
  const navigate = useNavigate()
  const { data, isPending } = useNotifications(1, 10)
  const readAll = useReadAllNotifications()
  const read = useReadNotification()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-lg border border-border bg-surface shadow-lg z-50 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border bg-surface-muted">
        <h3 className="font-semibold text-foreground">Thông báo</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => { onClose(); navigate('/notifications/settings'); }} title="Cài đặt">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => void readAll.mutateAsync()} title="Đánh dấu đã đọc tất cả">
            <Check className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto p-2 flex flex-col gap-1">
        {isPending ? (
          <p className="p-4 text-center text-sm text-text-muted">Đang tải...</p>
        ) : !data || data.items.length === 0 ? (
          <p className="p-4 text-center text-sm text-text-muted">Không có thông báo mới.</p>
        ) : (
          data.items.map(n => (
            <div 
              key={n.id} 
              className={`p-3 rounded-md transition-colors cursor-pointer ${n.isRead ? 'bg-surface hover:bg-surface-muted' : 'bg-primary/5 hover:bg-primary/10'}`}
              onClick={() => {
                if (!n.isRead) read.mutate(n.id)
                if (n.link) {
                  onClose()
                  navigate(n.link)
                }
              }}
            >
              <h4 className={`text-sm ${n.isRead ? 'font-medium text-foreground' : 'font-semibold text-primary'}`}>{n.title}</h4>
              <p className="text-sm text-text-muted mt-1">{n.body}</p>
              <p className="text-xs text-text-muted mt-2">{formatDateTime(n.createdAt).slice(0, -5)}</p>
            </div>
          ))
        )}
      </div>

      <div className="p-2 border-t border-border">
        <Button variant="ghost" className="w-full text-sm" onClick={() => { onClose(); navigate('/notifications'); }}>
          Xem tất cả
        </Button>
      </div>
    </div>
  )
}
