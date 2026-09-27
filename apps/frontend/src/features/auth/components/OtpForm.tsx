import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Alert } from '@/components/shared/Alert'
import { FormField } from '@/components/shared/FormField'
import { OtpInput } from '@/components/shared/OtpInput'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/services/client'
import { applyApiError } from '@/utils/formErrors'
import { otpSchema, type OtpValues } from '../schemas'
import { authStrings } from '../strings'
import { ResendOtpButton } from './ResendOtpButton'

type OtpFormProps = {
  /** Mốc (ms) được gửi lại OTP lần đầu. */
  initialResendAt: number
  submitLabel: string
  onSubmit: (otp: string) => Promise<void>
  /** Gửi lại mã, trả về mốc (ms) được gửi lại tiếp theo. */
  onResend: () => Promise<number>
  /** Thông báo hiện trên đầu form (ví dụ mã đã hết hạn). */
  notice?: ReactNode
}

// Dùng chung cho OTP đăng ký và OTP quên mật khẩu
export function OtpForm({
  initialResendAt,
  submitLabel,
  onSubmit,
  onResend,
  notice,
}: OtpFormProps) {
  const [resendAt, setResendAt] = useState(initialResendAt)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<OtpValues>({ resolver: zodResolver(otpSchema), defaultValues: { otp: '' } })

  const submit = handleSubmit(async ({ otp }) => {
    setResent(false)
    try {
      await onSubmit(otp)
    } catch (error) {
      // "Còn N lần thử" nằm trong detail nên hiện ngay dưới ô nhập
      if (error instanceof ApiError && error.code === 'OTP_INVALID') {
        setError('otp', { type: 'server', message: error.message })
      } else {
        applyApiError(error, setError, ['otp'])
      }
    }
  })

  async function resend() {
    setResending(true)
    setResent(false)
    clearErrors()
    try {
      setResendAt(await onResend())
      setResent(true)
    } catch (error) {
      applyApiError(error, setError, [])
    } finally {
      setResending(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {notice}
      {errors.root?.server && <Alert>{errors.root.server.message}</Alert>}
      {resent && <Alert variant="info">{authStrings.resend.sent}</Alert>}
      <FormField
        label={authStrings.fields.otp}
        hint={authStrings.hints.otp}
        error={errors.otp?.message}
      >
        <OtpInput autoFocus {...register('otp')} />
      </FormField>
      <Button type="submit" loading={isSubmitting}>
        {submitLabel}
      </Button>
      <ResendOtpButton key={resendAt} resendAt={resendAt} loading={resending} onResend={resend} />
    </form>
  )
}
