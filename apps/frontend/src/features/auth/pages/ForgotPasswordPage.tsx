import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { Alert } from '@/components/shared/Alert'
import { FormField } from '@/components/shared/FormField'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/services/client'
import { applyApiError } from '@/utils/formErrors'
import { deadlineIn } from '@/utils/time'
import { AuthLayout } from '../components/AuthLayout'
import { TextLink } from '../components/TextLink'
import { OtpForm } from '../components/OtpForm'
import { useForgotPassword, useResetPassword, useVerifyResetOtp } from '../hooks'
import {
  forgotEmailSchema,
  resetPasswordSchema,
  type ForgotEmailValues,
  type ResetPasswordValues,
} from '../schemas'
import { authStrings as s } from '../strings'

type Step =
  | { name: 'email' }
  | { name: 'otp'; email: string; resendAt: number; notice?: string }
  | { name: 'password'; email: string; otp: string }

const BackToLogin = <TextLink to="/dang-nhap">{s.forgot.backToLogin}</TextLink>

// Ba bước trong một trang: email → OTP → mật khẩu mới. OTP chỉ giữ trong bộ nhớ, F5 thì làm lại từ đầu.
export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>({ name: 'email' })

  if (step.name === 'email') {
    return (
      <AuthLayout
        title={s.forgot.title}
        description={s.forgot.descriptionEmail}
        footer={BackToLogin}
      >
        <EmailStep onSent={(email, resendAt) => setStep({ name: 'otp', email, resendAt })} />
      </AuthLayout>
    )
  }

  if (step.name === 'otp') {
    return (
      <AuthLayout
        title={s.forgot.title}
        description={s.forgot.descriptionOtp(step.email)}
        footer={
          <Button variant="ghost" onClick={() => setStep({ name: 'email' })}>
            {s.forgot.changeEmail}
          </Button>
        }
      >
        <OtpStep
          email={step.email}
          resendAt={step.resendAt}
          notice={step.notice}
          onVerified={(otp) => setStep({ name: 'password', email: step.email, otp })}
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title={s.forgot.titleNewPassword}
      description={s.forgot.descriptionNewPassword}
      footer={BackToLogin}
    >
      <NewPasswordStep
        email={step.email}
        otp={step.otp}
        onOtpRejected={(message) =>
          setStep({ name: 'otp', email: step.email, resendAt: deadlineIn(0), notice: message })
        }
      />
    </AuthLayout>
  )
}

function EmailStep({ onSent }: { onSent: (email: string, resendAt: number) => void }) {
  const forgot = useForgotPassword()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotEmailValues>({
    resolver: zodResolver(forgotEmailSchema),
    defaultValues: { email: '' },
  })

  const submit = handleSubmit(async ({ email }) => {
    try {
      const sent = await forgot.mutateAsync({ email })
      onSent(email, deadlineIn(sent.resendAfterSeconds))
    } catch (error) {
      applyApiError(error, setError, ['email'])
    }
  })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {errors.root?.server && <Alert>{errors.root.server.message}</Alert>}
      <FormField label={s.fields.email} error={errors.email?.message}>
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          {...register('email')}
        />
      </FormField>
      <Button type="submit" loading={isSubmitting}>
        {s.forgot.sendCode}
      </Button>
    </form>
  )
}

function OtpStep({
  email,
  resendAt,
  notice,
  onVerified,
}: {
  email: string
  resendAt: number
  notice?: string
  onVerified: (otp: string) => void
}) {
  const forgot = useForgotPassword()
  const verify = useVerifyResetOtp()
  return (
    <OtpForm
      initialResendAt={resendAt}
      submitLabel={s.forgot.continue}
      notice={notice ? <Alert>{notice}</Alert> : undefined}
      onSubmit={async (otp) => {
        // Kiểm tra mã mà chưa tiêu hủy, để chỉ nhập mật khẩu mới khi mã đã đúng
        await verify.mutateAsync({ email, otp })
        onVerified(otp)
      }}
      onResend={async () => {
        const sent = await forgot.mutateAsync({ email })
        return deadlineIn(sent.resendAfterSeconds)
      }}
    />
  )
}

const OTP_ERROR_CODES = ['OTP_EXPIRED', 'OTP_INVALID', 'OTP_ATTEMPTS_EXCEEDED']

function NewPasswordStep({
  email,
  otp,
  onOtpRejected,
}: {
  email: string
  otp: string
  onOtpRejected: (message: string) => void
}) {
  const navigate = useNavigate()
  const reset = useResetPassword()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await reset.mutateAsync({ email, otp, ...values })
      void navigate('/dang-nhap', { replace: true, state: { notice: s.passwordChanged } })
    } catch (error) {
      // Mã hết hạn hoặc hết lượt thử ở bước cuối thì quay lại bước nhập mã
      if (error instanceof ApiError && error.code && OTP_ERROR_CODES.includes(error.code)) {
        onOtpRejected(error.message)
        return
      }
      applyApiError(error, setError, ['newPassword', 'confirmPassword'])
    }
  })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {errors.root?.server && <Alert>{errors.root.server.message}</Alert>}
      <FormField
        label={s.fields.newPassword}
        hint={s.hints.password}
        error={errors.newPassword?.message}
      >
        <PasswordInput autoComplete="new-password" autoFocus {...register('newPassword')} />
      </FormField>
      <FormField label={s.fields.confirmPassword} error={errors.confirmPassword?.message}>
        <PasswordInput autoComplete="new-password" {...register('confirmPassword')} />
      </FormField>
      <Button type="submit" loading={isSubmitting}>
        {s.forgot.submitNewPassword}
      </Button>
    </form>
  )
}
