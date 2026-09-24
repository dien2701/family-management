import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Alert } from '@/components/shared/Alert'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { applyApiError } from '@/utils/formErrors'
import { useJoinFamily } from '../hooks'
import { joinFamilySchema, type JoinFamilyValues } from '../schemas'
import { familyStrings as s } from '../strings'
import { ConsentCheckbox } from './ConsentCheckbox'

type JoinFamilyFormProps = {
  /** Mã điền sẵn (từ link mời). */
  initialCode?: string
  /** Gọi sau khi tham gia và làm mới token thành công. */
  onJoined?: () => void
}

export function JoinFamilyForm({ initialCode = '', onJoined }: JoinFamilyFormProps) {
  const join = useJoinFamily()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<JoinFamilyValues>({
    resolver: zodResolver(joinFamilySchema),
    defaultValues: { code: initialCode, acceptPolicy: false },
  })

  const submit = handleSubmit(async (values) => {
    try {
      // Backend nhận mã đã in hoa; bỏ khoảng trắng người dùng gõ thừa
      await join.mutateAsync({
        code: values.code.replace(/\s+/g, '').toUpperCase(),
        acceptPolicy: values.acceptPolicy,
      })
      onJoined?.()
    } catch (error) {
      applyApiError(error, setError, ['code', 'acceptPolicy'])
    }
  })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {errors.root?.server && <Alert>{errors.root.server.message}</Alert>}
      <FormField label={s.fields.code} hint={s.hints.code} error={errors.code?.message}>
        <Input
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="font-mono tracking-widest uppercase"
          {...register('code')}
        />
      </FormField>
      <Controller
        control={control}
        name="acceptPolicy"
        render={({ field }) => (
          <ConsentCheckbox
            name={field.name}
            ref={field.ref}
            checked={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.acceptPolicy?.message}
          />
        )}
      />
      <Button type="submit" loading={isSubmitting}>
        {s.join.submit}
      </Button>
    </form>
  )
}
