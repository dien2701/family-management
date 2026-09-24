import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Alert } from '@/components/shared/Alert'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { applyApiError } from '@/utils/formErrors'
import { useCreateFamily } from '../hooks'
import { createFamilySchema, type CreateFamilyValues } from '../schemas'
import { familyStrings as s } from '../strings'
import { ConsentCheckbox } from './ConsentCheckbox'

export function CreateFamilyForm() {
  const create = useCreateFamily()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateFamilyValues>({
    resolver: zodResolver(createFamilySchema),
    defaultValues: { name: '', originPlace: '', description: '', acceptPolicy: false },
  })

  const submit = handleSubmit(async (values) => {
    try {
      // Thành công: token được làm mới, route guard chuyển sang app chính
      await create.mutateAsync({
        name: values.name,
        originPlace: values.originPlace || undefined,
        description: values.description || undefined,
        acceptPolicy: values.acceptPolicy,
      })
    } catch (error) {
      applyApiError(error, setError, ['name', 'originPlace', 'description', 'acceptPolicy'])
    }
  })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {errors.root?.server && <Alert>{errors.root.server.message}</Alert>}
      <FormField label={s.fields.name} error={errors.name?.message}>
        <Input autoComplete="off" {...register('name')} />
      </FormField>
      <FormField
        label={s.fields.originPlace}
        hint={s.hints.originPlace}
        error={errors.originPlace?.message}
      >
        <Input autoComplete="off" {...register('originPlace')} />
      </FormField>
      <FormField
        label={s.fields.description}
        hint={s.hints.description}
        error={errors.description?.message}
      >
        <Textarea rows={3} {...register('description')} />
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
      <p className="text-sm text-text-muted">{s.create.note}</p>
      <Button type="submit" loading={isSubmitting}>
        {s.create.submit}
      </Button>
    </form>
  )
}
