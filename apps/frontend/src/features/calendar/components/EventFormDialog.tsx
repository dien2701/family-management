import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert } from '@/components/shared/Alert'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FormField } from '@/components/shared/FormField'
import { ModalDialog } from '@/components/shared/ModalDialog'
import { DualDateInput } from '@/components/ui/DualDateInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/services/client'
import type { CustomEvent } from '@/types/api'
import { applyApiError } from '@/utils/formErrors'
import { cn } from '@/utils/cn'
import { emptyDualDate, type DualDateValue } from '@/utils/lunar'
import { useCreateEvent, useDeleteEvent, useEvent, useUpdateEvent } from '../hooks'
import { useCreateProposal } from '../../proposal/hooks'
import {
  EVENT_DATE_FIELDS,
  EVENT_FORM_FIELDS,
  dateOptions,
  emptyEventFormValues,
  eventFormSchema,
  eventToFormValues,
  formValuesToInput,
  type EventFormValues,
  type Repeat,
} from '../eventForm'
import { calendarStrings } from '../strings'

const s = calendarStrings.form

type EventFormDialogProps = {
  open: boolean
  /** Có id thì sửa (và có nút Xóa), không thì thêm mới. */
  eventId: number | null
  /** Ngày điền sẵn khi thêm từ một ô ngày (ngày/tháng, để trống năm). */
  initialDate?: DualDateValue
  mode: 'direct' | 'proposal'
  onClose: () => void
}

const REPEATS: { value: Repeat; label: string }[] = [
  { value: 'yearly', label: s.repeatYearly },
  { value: 'once', label: s.repeatOnce },
]

/** Thêm, sửa, xóa sự kiện chung (chỉ Admin; nơi gọi chỉ hiện nút cho Admin, quyền thật do máy chủ). */
export function EventFormDialog({ open, eventId, initialDate, mode, onClose }: EventFormDialogProps) {
  const editing = eventId !== null
  const event = useEvent(open ? eventId : null)
  const remove = useDeleteEvent()
  const createProposal = useCreateProposal()
  const [confirming, setConfirming] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const close = () => {
    setConfirming(false)
    setDeleteError(null)
    onClose()
  }

  const confirmDelete = async () => {
    if (eventId === null) return
    setDeleteError(null)
    try {
      if (mode === 'proposal') {
        await createProposal.mutateAsync({
          targetType: 'EVENT',
          action: 'DELETE',
          targetId: eventId,
        })
      } else {
        await remove.mutateAsync(eventId)
      }
      close()
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : s.deleteFailed)
    }
  }

  return (
    <>
      <ModalDialog 
        open={open} 
        title={
          mode === 'proposal' 
            ? (editing ? s.proposeEditTitle : s.proposeCreateTitle)
            : (editing ? s.editTitle : s.createTitle)
        } 
        onClose={close}
      >
        {editing && event.isPending ? (
          <p role="status" className="flex items-center gap-2 text-text-muted">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            Đang tải…
          </p>
        ) : editing && !event.data ? (
          <Alert>{s.loadFailed}</Alert>
        ) : (
          <EventForm
            event={event.data}
            initialDate={initialDate}
            mode={mode}
            onDone={close}
            onDelete={editing ? () => setConfirming(true) : undefined}
          />
        )}
      </ModalDialog>
      <ConfirmDialog
        open={confirming}
        title={s.deleteConfirmTitle}
        description={s.deleteConfirmBody(event.data?.title ?? '')}
        confirmLabel={s.deleteConfirm}
        cancelLabel={s.cancel}
        danger
        loading={remove.isPending}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          setConfirming(false)
          setDeleteError(null)
        }}
      />
    </>
  )
}

type EventFormProps = {
  event?: CustomEvent
  initialDate?: DualDateValue
  mode: 'direct' | 'proposal'
  onDone: () => void
  onDelete?: () => void
}

function EventForm({ event, initialDate, mode, onDone, onDelete }: EventFormProps) {
  const create = useCreateEvent()
  const update = useUpdateEvent()
  const createProposal = useCreateProposal()
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: event ? eventToFormValues(event) : emptyEventFormValues(initialDate),
  })
  const repeat = watch('repeat')

  const submit = handleSubmit(async (values) => {
    const input = formValuesToInput(values)
    try {
      if (mode === 'proposal') {
        await createProposal.mutateAsync({
          targetType: 'EVENT',
          action: event ? 'UPDATE' : 'CREATE',
          targetId: event?.id,
          payload: input,
        })
      } else {
        if (event) await update.mutateAsync({ id: event.id, input })
        else await create.mutateAsync(input)
      }
      onDone()
    } catch (e) {
      if (e instanceof ApiError) {
        const dateError = e.errors.find((f) => EVENT_DATE_FIELDS.includes(f.field))
        if (dateError) setError('date', { type: 'server', message: dateError.message })
      }
      applyApiError(e, setError, EVENT_FORM_FIELDS)
    }
  })

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
      {errors.root?.server && !errors.date && <Alert>{errors.root.server.message}</Alert>}

      <FormField label={s.title} error={errors.title?.message}>
        <Input maxLength={200} autoComplete="off" {...register('title')} />
      </FormField>

      <FormField label={s.description} hint={s.descriptionHint} error={errors.description?.message}>
        <Textarea maxLength={2000} {...register('description')} />
      </FormField>

      <Controller
        control={control}
        name="repeat"
        render={({ field }) => (
          <fieldset className="flex min-w-0 flex-col gap-1.5">
            <legend className="mb-1.5 text-base font-medium">{s.repeat}</legend>
            <div className="grid grid-cols-2 gap-1 rounded-field bg-secondary p-1">
              {REPEATS.map(({ value, label }) => (
                <label key={value} className="relative">
                  <input
                    type="radio"
                    name="repeat"
                    className="peer sr-only"
                    checked={field.value === value}
                    onChange={() => {
                      field.onChange(value)
                      // Lặp hằng năm không có năm
                      if (value === 'yearly') setValue('date.year', '')
                    }}
                  />
                  <span
                    className={cn(
                      'flex min-h-11 cursor-pointer items-center justify-center rounded-button px-3 text-base font-semibold text-secondary-fg transition-colors duration-200 ease-out',
                      'peer-checked:bg-primary peer-checked:text-primary-fg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
                    )}
                  >
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      />

      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          <DualDateInput
            label={s.date}
            value={field.value}
            onChange={field.onChange}
            error={errors.date?.message}
            hint={repeat === 'yearly' ? s.dateYearlyHint : s.dateOnceHint}
            {...dateOptions(repeat)}
          />
        )}
      />

      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        {onDelete && (
          <Button type="button" variant="ghost" className="text-danger md:mr-auto" onClick={onDelete}>
            {mode === 'proposal' ? s.proposeDelete : s.delete}
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          {mode === 'proposal' ? s.sendProposal : s.save}
        </Button>
      </div>
    </form>
  )
}

/** Giá trị điền sẵn cho ô ngày: ngày/tháng của một ngày đã chọn, theo lịch đang xem, để trống năm. */
export function prefillDate(
  calendar: 'solar' | 'lunar',
  d: { day: number; month: number; leap?: boolean },
): DualDateValue {
  return {
    ...emptyDualDate(calendar),
    day: String(d.day),
    month: String(d.month),
    leap: calendar === 'lunar' && d.leap === true,
  }
}
