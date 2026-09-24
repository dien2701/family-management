import { Navigate, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { deadlineIn } from '@/utils/time'
import { AuthLayout } from '../components/AuthLayout'
import { OtpForm } from '../components/OtpForm'
import { carryFrom } from '../routing'
import { useResendOtp, useVerifyOtp } from '../hooks'
import { authStrings as s } from '../strings'

type VerifyState = { email?: string; resendAt?: number; from?: string }

// Email đi theo state của lịch sử trình duyệt, không nằm trên URL. Mất state (mở thẳng URL) thì quay về đăng ký.
export function VerifyOtpPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state ?? {}) as VerifyState
  const carried = carryFrom(location.state)
  const verify = useVerifyOtp()
  const resend = useResendOtp()

  if (!state.email) return <Navigate to="/dang-ky" replace />
  const email = state.email

  return (
    <AuthLayout
      title={s.verifyOtp.title}
      description={s.verifyOtp.description(email)}
      footer={
        <Button
          variant="ghost"
          onClick={() => void navigate('/dang-ky', { replace: true, state: carried })}
        >
          {s.verifyOtp.changeEmail}
        </Button>
      }
    >
      <OtpForm
        initialResendAt={state.resendAt ?? 0}
        submitLabel={s.verifyOtp.submit}
        // Thành công: AuthProvider lưu phiên, GuestOnly chuyển tới trang đích
        onSubmit={async (otp) => {
          await verify.mutateAsync({ email, otp })
        }}
        onResend={async () => {
          const sent = await resend.mutateAsync({ email })
          const resendAt = deadlineIn(sent.resendAfterSeconds)
          // Ghi lại mốc mới để F5 không làm mất đếm ngược
          void navigate(location.pathname, {
            replace: true,
            state: { email, resendAt, ...carried },
          })
          return resendAt
        }}
      />
    </AuthLayout>
  )
}
