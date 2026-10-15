import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { Alert } from '@/components/shared/Alert'
import { FormField } from '@/components/shared/FormField'
import { ModalDialog } from '@/components/shared/ModalDialog'
import { DualDateInput } from '@/components/ui/DualDateInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/services/client'
import type { MemberDetail } from '@/types/api'
import { resolveDualDate } from '@/utils/lunar'
import { useMemberDetail } from '../../member/hooks'
import {
  BIRTH_OPTIONS,
  DEATH_OPTIONS,
  memberToFormValues,
  type MemberFormValues,
} from '../../member/schemas'
import { usePatchMemberDates } from '../hooks'
import { calendarStrings } from '../strings'

const s = calendarStrings.memberDate

type MemberDateDialogProps = {
  open: boolean
  memberId: number | null
  kind: 'MEMORIAL' | 'BIRTHDAY'
  onClose: () => void
}

/** Admin sửa ngày mất + giỗ riêng, hoặc ngày sinh, ngay tại Lịch. Lưu thẳng vào hồ sơ thành viên (một nguồn dữ liệu). */
export function MemberDateDialog({ open, memberId, kind, onClose }: MemberDateDialogProps) {
  const member = useMemberDetail(memberId ?? 0, open && memberId !== null)
  return (
    <ModalDialog open={open} title={kind === 'MEMORIAL' ? s.memorialTitle : s.birthdayTitle} onClose={onClose}>
      {member.isPending ? (
        <p role="status" className="flex items-center gap-2 text-text-muted">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Đang tải…
        </p>
      ) : !member.data ? (
        <Alert>{s.loadFailed}</Alert>
      ) : (
        <MemberDateForm member={member.data} kind={kind} onDone={onClose} />
      )}
    </ModalDialog>
  )
}

function MemberDateForm({
  member,
  kind,
  onDone,
}: {
  member: MemberDetail
  kind: 'MEMORIAL' | 'BIRTHDAY'
  onDone: () => void
}) {
  const patch = usePatchMemberDates()
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormValues>({ defaultValues: memberToFormValues(member) })

  const submit = handleSubmit(async (v) => {
    let changes: Partial<MemberFormValues>
    if (kind === 'BIRTHDAY') {
      const r = resolveDualDate(v.birth, BIRTH_OPTIONS)
      if (r.status === 'invalid' || r.status === 'incomplete') {
        setError('birth', { type: 'validate', message: r.message })
        return
      }
      changes = { birth: v.birth }
    } else {
      const r = resolveDualDate(v.deathDate, DEATH_OPTIONS)
      if (r.status === 'invalid' || r.status === 'incomplete') {
        setError('deathDate', { type: 'validate', message: r.message })
        return
      }
      const { memorialDay: day, memorialMonth: month } = v
      if (day || month) {
        const d = Number(day)
        const m = Number(month)
        if (!day || !month) {
          setError(day ? 'memorialMonth' : 'memorialDay', { type: 'validate', message: s.memorialBoth })
          return
        }
        if (d < 1 || d > 30) {
          setError('memorialDay', { type: 'validate', message: s.memorialDayRange })
          return
        }
        if (m < 1 || m > 12) {
          setError('memorialMonth', { type: 'validate', message: s.memorialMonthRange })
          return
        }
      }
      changes = { deathDate: v.deathDate, memorialDay: day, memorialMonth: month }
    }
    try {
      await patch.mutateAsync({ memberId: member.id, patch: changes })
      onDone()
    } catch (e) {
      setError('root.server', { type: 'server', message: e instanceof ApiError ? e.message : s.saveFailed })
    }
  })

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="flex flex-col gap-4">
      {errors.root?.server && <Alert>{errors.root.server.message}</Alert>}
      <p className="-mt-2 font-medium break-words">{member.fullName}</p>

      {kind === 'BIRTHDAY' ? (
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
      ) : (
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
                error={errors.deathDate?.message}
              />
            )}
          />
          <fieldset className="flex min-w-0 flex-col gap-3">
            <legend className="mb-1.5 text-base font-medium">{s.memorialTitleField}</legend>
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
                      onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                    />
                  </FormField>
                )}
              />
            </div>
            <p className="text-sm text-text-muted">{s.memorialHint}</p>
          </fieldset>
        </>
      )}

      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Button type="submit" loading={isSubmitting}>
          {s.save}
        </Button>
      </div>
    </form>
  )
}
