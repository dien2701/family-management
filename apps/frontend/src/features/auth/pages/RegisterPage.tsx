import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { Alert } from '@/components/shared/Alert'
import { FormField } from '@/components/shared/FormField'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { applyApiError } from '@/utils/formErrors'
import { deadlineIn } from '@/utils/time'
import { AuthLayout } from '../components/AuthLayout'
import { TextLink } from '../components/TextLink'
import { GoogleButton } from '../components/GoogleButton'
import { OrDivider } from '../components/OrDivider'
import { isGoogleConfigured } from '../googleConfig'
import { useRegister } from '../hooks'
import { carryFrom } from '../routing'
import { registerSchema, type RegisterValues } from '../schemas'
import { authStrings as s } from '../strings'

export function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const registerAccount = useRegister()
  const [googleError, setGoogleError] = useState<string | null>(null)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  })

  const submit = handleSubmit(async (values) => {
    setGoogleError(null)
    try {
      const sent = await registerAccount.mutateAsync(values)
      // Email chỉ đi theo state của lịch sử (không đưa lên URL); mốc gửi lại giữ được khi F5
      void navigate('/xac-thuc', {
        state: {
          email: values.email,
          resendAt: deadlineIn(sent.resendAfterSeconds),
          ...carryFrom(location.state),
        },
      })
    } catch (error) {
      applyApiError(error, setError, [
        'fullName',
        'email',
        'password',
        'confirmPassword',
        'acceptTerms',
      ])
    }
  })

  return (
    <AuthLayout
      title={s.register.title}
      description={s.register.description}
      footer={
        <p className="text-text-muted">
          {s.register.haveAccount}{' '}
          <TextLink to="/dang-nhap" state={carryFrom(location.state)}>
            {s.register.toLogin}
          </TextLink>
        </p>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {(errors.root?.server || googleError) && (
          <Alert>{errors.root?.server?.message ?? googleError}</Alert>
        )}
        <FormField label={s.fields.fullName} error={errors.fullName?.message}>
          <Input autoComplete="name" autoFocus {...register('fullName')} />
        </FormField>
        <FormField label={s.fields.email} error={errors.email?.message}>
          <Input type="email" inputMode="email" autoComplete="email" {...register('email')} />
        </FormField>
        <FormField
          label={s.fields.password}
          hint={s.hints.password}
          error={errors.password?.message}
        >
          <PasswordInput autoComplete="new-password" {...register('password')} />
        </FormField>
        <FormField label={s.fields.confirmPassword} error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" {...register('confirmPassword')} />
        </FormField>
        <div className="flex flex-col gap-1.5">
          <Controller
            control={control}
            name="acceptTerms"
            render={({ field }) => (
              <Checkbox
                label={
                  <>
                    {s.register.acceptTermsBefore}
                    <Link
                      to="/chinh-sach-bao-mat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-accent-text underline"
                    >
                      {s.register.acceptTermsLink}
                    </Link>
                    {s.register.acceptTermsAfter}
                  </>
                }
                invalid={Boolean(errors.acceptTerms)}
                aria-describedby={errors.acceptTerms ? 'accept-terms-error' : undefined}
                name={field.name}
                ref={field.ref}
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.acceptTerms && (
            <p id="accept-terms-error" role="alert" className="text-sm font-medium text-danger">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>
        <Button type="submit" loading={isSubmitting}>
          {s.register.submit}
        </Button>
        {isGoogleConfigured && (
          <>
            <OrDivider />
            <GoogleButton text="signup_with" onError={setGoogleError} />
          </>
        )}
      </form>
    </AuthLayout>
  )
}
