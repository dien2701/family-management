import { useMemo, useState } from 'react'
import { FormField } from '@/components/shared/FormField'
import { MemberPickerDialog } from '@/components/shared/MemberPickerDialog'
import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useMemberSearch } from '@/hooks/useMemberSearch'
import { ApiError } from '@/services/client'
import type { MemberSummary, Relative } from '@/types/api'
import { useAddRelative } from '../hooks'
import { memberStrings } from '../strings'

const MAX_LABEL = 50

type AddRelativeDialogProps = {
  open: boolean
  /** Chủ hồ sơ đang thêm người thân. */
  memberId: number
  /** Các dòng đã có, để không chọn trùng. */
  existing: Relative[]
  onClose: () => void
}

/**
 * Thêm người thân: chọn một thành viên (tìm không dấu), nhập nhãn. Nơi dùng đặt `key` mới mỗi lần mở để
 * ô tìm, người đã chọn và nhãn về trạng thái ban đầu.
 */
export function AddRelativeDialog({ open, memberId, existing, onClose }: AddRelativeDialogProps) {
  const s = memberStrings.relatives
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<MemberSummary | null>(null)
  const [label, setLabel] = useState('')
  const [labelError, setLabelError] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)

  const search = useMemberSearch(useDebouncedValue(query), open)
  const add = useAddRelative(memberId)

  // Chủ hồ sơ và những người đã có vẫn hiện nhưng không chọn được, kèm lý do
  const disabledReasons = useMemo(() => {
    const reasons: Record<number, string> = { [memberId]: s.picker.owner }
    for (const row of existing) reasons[row.relative.id] = s.picker.alreadyAdded
    return reasons
  }, [existing, memberId, s.picker.alreadyAdded, s.picker.owner])

  const submit = async () => {
    if (!selected) return
    const trimmed = label.trim()
    if (!trimmed) return setLabelError(s.labelRequired)
    if (trimmed.length > MAX_LABEL) return setLabelError(s.labelTooLong)
    setLabelError(undefined)
    setError(null)
    try {
      await add.mutateAsync({ relativeMemberId: selected.id, label: trimmed })
      onClose()
    } catch (e) {
      if (!(e instanceof ApiError)) return setError(s.failed)
      const fieldError = e.errors.find((f) => f.field === 'label')
      if (fieldError) setLabelError(fieldError.message)
      else setError(e.message)
    }
  }

  return (
    <MemberPickerDialog
      open={open}
      title={s.picker.title}
      description={s.picker.description}
      confirmLabel={s.picker.confirm}
      labels={s.picker}
      query={query}
      onQueryChange={setQuery}
      members={search.data?.items ?? []}
      totalCount={search.data?.totalElements}
      loading={search.isFetching}
      loadFailed={search.isError}
      onRetry={() => void search.refetch()}
      disabledReasons={disabledReasons}
      selected={selected}
      onSelect={(member) => {
        setSelected(member)
        setError(null)
      }}
      error={error}
      submitting={add.isPending}
      onConfirm={() => void submit()}
      onCancel={onClose}
    >
      <FormField label={s.label} hint={s.labelHint} error={labelError}>
        <Input
          value={label}
          maxLength={MAX_LABEL}
          autoComplete="off"
          onChange={(e) => {
            setLabel(e.target.value)
            setLabelError(undefined)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void submit()
            }
          }}
        />
      </FormField>
    </MemberPickerDialog>
  )
}
