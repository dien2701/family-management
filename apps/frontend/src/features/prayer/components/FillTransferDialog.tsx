import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { isApproved } from '@/features/auth/routing'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/services/client'
import { useSavePrayerFill } from '../hooks'
import {
  fillsSignature,
  readDeclinedSignature,
  readLocalFills,
  removeLocalFill,
  writeDeclinedSignature,
} from '../localFill'
import { prayerStrings } from '../strings'

const s = prayerStrings.transfer

/**
 * Hỏi chuyển thông tin đã điền trên máy vào tài khoản khi người dùng đã duyệt đăng nhập mà máy còn dữ liệu
 * (DECISIONS #90). Từ chối thì nhớ chữ ký của dữ liệu trên máy: chỉ hỏi lại khi dữ liệu đó thay đổi.
 */
export function FillTransferDialog() {
  const { user } = useAuth()
  const save = useSavePrayerFill()
  const [handled, setHandled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fills = isApproved(user) && !handled ? readLocalFills() : {}
  const open =
    Object.keys(fills).length > 0 && fillsSignature(fills) !== readDeclinedSignature()

  const decline = () => {
    writeDeclinedSignature(fillsSignature(fills))
    setHandled(true)
  }

  const transfer = async () => {
    setError(null)
    let failed = false
    for (const [id, values] of Object.entries(fills)) {
      try {
        await save.mutateAsync({ id: Number(id), values })
        removeLocalFill(Number(id))
      } catch (e) {
        // Bài đã bị xóa thì bỏ qua bản trên máy; lỗi khác giữ lại để thử lại
        if (e instanceof ApiError && e.status === 404) removeLocalFill(Number(id))
        else failed = true
      }
    }
    if (failed) setError(s.failed)
    else setHandled(true)
  }

  return (
    <ConfirmDialog
      open={open}
      title={s.title}
      description={s.body}
      confirmLabel={s.confirm}
      cancelLabel={s.cancel}
      loading={save.isPending}
      error={error}
      onConfirm={() => void transfer()}
      onCancel={decline}
    />
  )
}
