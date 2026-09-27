import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router'
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
import { GoogleButton } from '../components/GoogleButton'
import { OrDivider } from '../components/OrDivider'
import { isGoogleConfigured } from '../googleConfig'
import { useLogin } from '../hooks'
import { carryFrom } from '../routing'
import { loginSchema, type LoginValues } from '../schemas'
import { authStrings as s } from '../strings'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const notice = (location.state as { notice?: string } | null)?.notice
  const login = useLogin()
  const [googleError, setGoogleError] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const submit = handleSubmit(async (values) => {
    setGoogleError(null)
    setUnverifiedEmail(null)
    try {
      // Thành công: AuthProvider lưu phiên, GuestOnly tự chuyển tới trang đích
      await login.mutateAsync(values)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(values.email)
      }
      applyApiError(error, setError, ['email', 'password'])
    }
  })

  return (
    <AuthLayout
      title={s.login.title}
      description={s.login.description}
      footer={
        <p className="text-text-muted">
          {s.login.noAccount}{' '}
          <TextLink to="/dang-ky" state={carryFrom(location.state)}>
            {s.login.toRegister}
          </TextLink>
        </p>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {notice && <Alert variant="info">{notice}</Alert>}
        {(errors.root?.server || googleError) && (
          <Alert>
            <p>{errors.root?.server?.message ?? googleError}</p>
            {unverifiedEmail && (
              <button
                type="button"
                className="mt-1 min-h-11 font-semibold underline"
                onClick={() =>
                  void navigate('/xac-thuc', {
                    state: {
                      email: unverifiedEmail,
                      resendAt: deadlineIn(0),
                      ...carryFrom(location.state),
                    },
                  })
                }
              >
                {s.login.unverified}
              </button>
            )}
          </Alert>
        )}
        <FormField label={s.fields.email} error={errors.email?.message}>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            {...register('email')}
          />
        </FormField>
        <FormField label={s.fields.password} error={errors.password?.message}>
          <PasswordInput autoComplete="current-password" {...register('password')} />
        </FormField>
        <div className="-mt-2 text-right">
          <TextLink to="/quen-mat-khau" className="font-medium">
            {s.login.forgot}
          </TextLink>
        </div>
        <Button type="submit" loading={isSubmitting}>
          {s.login.submit}
        </Button>
        {isGoogleConfigured && (
          <>
            <OrDivider />
            <GoogleButton text="signin_with" onError={setGoogleError} />
          </>
        )}
      </form>
    </AuthLayout>
  )
}
