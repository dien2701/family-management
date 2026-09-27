import { Button } from '@/components/ui/button'
import { useCountdown } from '@/hooks/useCountdown'
import { authStrings } from '../strings'

type ResendOtpButtonProps = {
  /** Mốc thời gian (ms) được gửi lại; đổi mốc thì cha phải gắn `key` mới để đếm lại. */
  resendAt: number
  loading: boolean
  onResend: () => void
}

export function ResendOtpButton({ resendAt, loading, onResend }: ResendOtpButtonProps) {
  const remaining = useCountdown(resendAt)
  const waiting = remaining > 0
  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full tabular-nums"
      disabled={waiting}
      loading={loading}
      onClick={onResend}
    >
      {waiting ? authStrings.resend.wait(remaining) : authStrings.resend.action}
    </Button>
  )
}
