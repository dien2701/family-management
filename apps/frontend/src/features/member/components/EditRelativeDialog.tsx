import { useState } from 'react'
import { FormField } from '@/components/shared/FormField'
import { ModalDialog } from '@/components/shared/ModalDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/services/client'
import type { Relative } from '@/types/api'
import { useUpdateRelative } from '../hooks'
import { memberStrings } from '../strings'

const MAX_LABEL = 50

type EditRelativeDialogProps = {
  memberId: number
  /** Dòng đang sửa; `null` là đóng. */
  relative: Relative | null
  onClose: () => void
}

/** Sửa nhãn của một người thân (chỉ nhãn đổi được, người thân giữ nguyên). Đặt `key` theo dòng để form về ban đầu. */
export function EditRelativeDialog({ memberId, relative, onClose }: EditRelativeDialogProps) {
  const s = memberStrings.relatives
  const [label, setLabel] = useState(relative?.label ?? '')
  const [error, setError] = useState<string | undefined>()
  const update = useUpdateRelative(memberId)

  const submit = async () => {
    if (!relative) return
    const trimmed = label.trim()
    if (!trimmed) return setError(s.labelRequired)
    if (trimmed.length > MAX_LABEL) return setError(s.labelTooLong)
    setError(undefined)
    try {
      await update.mutateAsync({ relativeId: relative.id, label: trimmed })
      onClose()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : s.failed)
    }
  }

  return (
    <ModalDialog open={relative !== null} title={s.editTitle} busy={update.isPending} onClose={onClose}>
      {relative && <p className="font-semibold [overflow-wrap:anywhere]">{relative.relative.fullName}</p>}
      <FormField label={s.label} hint={s.labelHint} error={error}>
        <Input
          value={label}
          maxLength={MAX_LABEL}
          autoComplete="off"
          autoFocus
          onChange={(e) => {
            setLabel(e.target.value)
            setError(undefined)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void submit()
            }
          }}
        />
      </FormField>
      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Button variant="secondary" disabled={update.isPending} onClick={onClose}>
          {s.editCancel}
        </Button>
        <Button loading={update.isPending} onClick={() => void submit()}>
          {s.editSubmit}
        </Button>
      </div>
    </ModalDialog>
  )
}
