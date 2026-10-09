import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert } from '@/components/shared/Alert'
import { AvatarUpload } from '@/components/shared/AvatarUpload'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DualDateInput } from '@/components/ui/DualDateInput'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { MemberDetail, MemberInput } from '@/types/api'
import { applyApiError } from '@/utils/formErrors'
import {
  BIRTH_OPTIONS,
  DEATH_OPTIONS,
  emptyMemberFormValues,
  formValuesToInput,
  MEMBER_FORM_FIELDS,
  memberFormSchema,
  memberToFormValues,
  type MemberFormValues,
} from '../schemas'
import { memberStrings } from '../strings'

type MemberFormProps = {
  /** Có thì là sửa hồ sơ, không có thì là thêm mới. */
  member?: MemberDetail
  /** Khóa nhóm "đã mất" (đã qua đời, ngày mất, ngày giỗ ghi đè, nơi an táng): User tự sửa hồ sơ (DECISIONS #76). */
  lockDeathFields?: boolean
  submitLabel: string
  /** Ném `ApiError` khi lưu lỗi, form sẽ gán lỗi vào đúng trường. */
  onSubmit: (input: MemberInput, avatar: File | null) => Promise<void>
  onCancel: () => void
}

export function MemberForm({
  member,
  lockDeathFields = false,
  submitLabel,
  onSubmit,
  onCancel,
}: MemberFormProps) {
  const s = memberStrings.form
  const [avatar, setAvatar] = useState<File | null>(null)
  const {
    register,
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: member ? memberToFormValues(member) : emptyMemberFormValues(),
  })
  const fullName = watch('fullName')
  const isDeceased = watch('isDeceased')

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(formValuesToInput(values), avatar)
    } catch (error) {
      applyApiError(error, setError, MEMBER_FORM_FIELDS)
    }
  })

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
      {errors.root?.server && <Alert>{errors.root.server.message}</Alert>}

      <Section title={s.sections.basic}>
        <AvatarUpload
          label={memberStrings.avatar.label}
          name={fullName || member?.fullName || ''}
          currentUrl={member?.avatarUrl}
          file={avatar}
          onChange={setAvatar}
          disabled={isSubmitting}
          hint={memberStrings.avatar.hint}
          labels={memberStrings.avatar}
        />
        <FormField label={s.fullName} hint={s.fullNameHint} error={errors.fullName?.message}>
          <Input {...register('fullName')} autoComplete="off" maxLength={200} />
        </FormField>
        <FormField label={s.tabooName} error={errors.tabooName?.message}>
          <Input {...register('tabooName')} autoComplete="off" maxLength={200} />
        </FormField>
        <FormField label={s.gender} error={errors.gender?.message}>
          <Select {...register('gender')}>
            <option value="">{s.genderOptions.none}</option>
            <option value="M">{s.genderOptions.M}</option>
            <option value="F">{s.genderOptions.F}</option>
          </Select>
        </FormField>
        <FormField label={s.labels} hint={s.labelsHint} error={errors.labels?.message}>
          <Input {...register('labels')} autoComplete="off" />
        </FormField>
      </Section>

      <Section title={s.sections.birth}>
        <Controller
          control={control}
          name="birth"
          render={({ field }) => (
            <DualDateInput
              {...BIRTH_OPTIONS}
              label={s.birthDate}
              hint={s.birthHint}
              value={field.value}
              onChange={field.onChange}
              error={errors.birth?.message}
            />
          )}
        />
      </Section>

      <Section title={s.sections.contact}>
        <p className="-mt-2 text-sm text-text-muted">{s.contactHint}</p>
        <FormField label={s.phone} error={errors.phone?.message}>
          <Input {...register('phone')} type="tel" inputMode="tel" autoComplete="off" />
        </FormField>
        <FormField label={s.email} error={errors.email?.message}>
          <Input {...register('email')} type="email" autoComplete="off" />
        </FormField>
      </Section>

      <Section title={s.sections.biography}>
        <FormField label={s.biography} error={errors.biography?.message}>
          <Textarea {...register('biography')} rows={5} />
        </FormField>
      </Section>

      <Section title={s.sections.death}>
        {lockDeathFields && <Alert variant="info">{s.deathLocked}</Alert>}
        {/* Nhóm "đã mất" dùng Controller (giá trị nằm trong form, không đọc từ DOM) để khóa được mà vẫn gửi nguyên giá trị cũ */}
        <Controller
          control={control}
          name="isDeceased"
          render={({ field }) => (
            <Checkbox
              label={s.isDeceased}
              checked={field.value}
              disabled={lockDeathFields}
              invalid={Boolean(errors.isDeceased)}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        {errors.isDeceased && (
          <p role="alert" className="text-sm font-medium text-danger">
            {errors.isDeceased.message}
          </p>
        )}
        {isDeceased && (
          <>
            <Controller
              control={control}
              name="deathDate"
              render={({ field }) => (
                <DualDateInput
                  {...DEATH_OPTIONS}
                  label={s.deathDate}
                  hint={s.deathHint}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={lockDeathFields}
                  error={errors.deathDate?.message}
                />
              )}
            />
            <fieldset className="flex min-w-0 flex-col gap-3">
              <legend className="mb-1.5 text-base font-medium">{s.memorialTitle}</legend>
              <div className="grid grid-cols-2 gap-2">
                <Controller
                  control={control}
                  name="memorialDay"
                  render={({ field }) => (
                    <FormField label={s.memorialDay} error={errors.memorialDay?.message}>
                      <Input
                        {...field}
                        inputMode="numeric"
                        maxLength={2}
                        autoComplete="off"
                        disabled={lockDeathFields}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                      />
                    </FormField>
                  )}
                />
                <Controller
                  control={control}
                  name="memorialMonth"
                  render={({ field }) => (
                    <FormField label={s.memorialMonth} error={errors.memorialMonth?.message}>
                      <Input
                        {...field}
                        inputMode="numeric"
                        maxLength={2}
                        autoComplete="off"
                        disabled={lockDeathFields}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                      />
                    </FormField>
                  )}
                />
              </div>
              <p className="text-sm text-text-muted">{s.memorialHint}</p>
            </fieldset>
            <Controller
              control={control}
              name="burialPlace"
              render={({ field }) => (
                <FormField label={s.burialPlace} error={errors.burialPlace?.message}>
                  <Input {...field} autoComplete="off" maxLength={300} disabled={lockDeathFields} />
                </FormField>
              )}
            />
          </>
        )}
      </Section>

      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onCancel}>
          {s.cancel}
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 shadow-card md:p-6">
      <h2 className="text-lg leading-tight font-semibold">{title}</h2>
      {children}
    </section>
  )
}
