import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { authStrings } from '../strings'

export function LogoutButton({ className }: { className?: string }) {
  const { logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleClick() {
    setLoading(true)
    setFailed(false)
    try {
      await logout()
    } catch {
      setFailed(true)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant="secondary"
        className={className}
        loading={loading}
        onClick={() => void handleClick()}
      >
        <LogOut aria-hidden="true" />
        {authStrings.logout}
      </Button>
      {failed && (
        <p role="alert" className="text-sm font-medium text-danger">
          {authStrings.logoutFailed}
        </p>
      )}
    </div>
  )
}
