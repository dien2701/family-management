import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Alert } from '@/components/shared/Alert'
import { FormField } from '@/components/shared/FormField'
import { ModalDialog } from '@/components/shared/ModalDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Prayer } from '@/types/api'
import { applyApiError } from '@/utils/formErrors'
import { useCreatePrayer, useUpdatePrayer } from '../hooks'
import { PRAYER_FORM_FIELDS, prayerFormSchema, type PrayerFormValues } from '../schemas'
import { extractSlots } from '../slots'
import { prayerStrings } from '../strings'

const s = prayerStrings.form

type PrayerFormDialogProps = {
  open: boolean
  /** Có bài thì sửa, không thì thêm mới. */
  prayer?: Prayer
  onClose: () => void
  /** Gọi sau khi lưu xong, kèm bài đã lưu. */
  onSaved?: (prayer: Prayer) => void
}

/** Thêm hoặc sửa bài khấn. Chỉ Admin thấy nút mở; quyền thật do máy chủ kiểm. */
export function PrayerFormDialog({ open, prayer, onClose, onSaved }: PrayerFormDialogProps) {
  return (
    <ModalDialog open={open} title={prayer ? s.editTitle : s.createTitle} onClose={onClose}>
      <PrayerForm prayer={prayer} onClose={onClose} onSaved={onSaved} />
    </ModalDialog>
  )
}

function PrayerForm({ prayer, onClose, onSaved }: Omit<PrayerFormDialogProps, 'open'>) {
  const create = useCreatePrayer()
  const update = useUpdatePrayer()
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PrayerFormValues>({
    resolver: zodResolver(prayerFormSchema),
    defaultValues: { title: prayer?.title ?? '', content: prayer?.content ?? '' },
  })
  const slots = extractSlots(watch('content'))

  const submit = handleSubmit(async (values) => {
    try {
      const saved = prayer
        ? await update.mutateAsync({ id: prayer.id, input: values })
        : await create.mutateAsync(values)
      onSaved?.(saved)
      onClose()
    } catch (e) {
      applyApiError(e, setError, PRAYER_FORM_FIELDS)
    }
  })

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
      {errors.root?.server && <Alert>{errors.root.server.message}</Alert>}

      <FormField label={s.title} error={errors.title?.message}>
        <Input maxLength={200} autoComplete="off" {...register('title')} />
      </FormField>

      <FormField label={s.content} hint={s.contentHint} error={errors.content?.message}>
        <Textarea rows={10} maxLength={20000} {...register('content')} />
      </FormField>

      <section aria-label={s.slotsTitle} className="rounded-field bg-surface-muted p-3">
        <h3 className="text-sm font-semibold text-text-muted">{s.slotsTitle}</h3>
        {slots.length === 0 ? (
          <p className="mt-1 text-sm text-text-muted">{s.slotsNone}</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {slots.map((name) => (
              <li
                key={name}
                className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-fg"
              >
                {name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          {s.cancel}
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {s.save}
        </Button>
      </div>
    </form>
  )
}
