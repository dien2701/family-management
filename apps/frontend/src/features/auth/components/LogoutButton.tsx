import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { authStrings } from '../strings'

export function LogoutButton({ className }: { className?: string }) {
  const { logout } = useAuth()
  const [asking, setAsking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    setFailed(false)
    try {
      await logout()
      toast.success('Đã đăng xuất.')
    } catch {
      setFailed(true)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <Button
        variant="danger"
        className={className}
        onClick={() => {
          setFailed(false)
          setAsking(true)
        }}
      >
        <LogOut aria-hidden="true" />
        {authStrings.logout}
      </Button>
      <ConfirmDialog
        open={asking}
        title="Đăng xuất?"
        description="Bạn sẽ cần đăng nhập lại để dùng các chức năng của tài khoản."
        confirmLabel={authStrings.logout}
        cancelLabel="Hủy"
        danger
        loading={loading}
        error={failed ? authStrings.logoutFailed : null}
        onConfirm={() => void handleConfirm()}
        onCancel={() => setAsking(false)}
      />
    </div>
  )
}
