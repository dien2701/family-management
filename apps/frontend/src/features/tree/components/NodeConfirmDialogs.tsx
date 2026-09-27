import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ApiError } from '@/services/client'
import type { TreeNode } from '@/types/api'
import { useDeleteNode, useRemoveMember } from '../hooks'
import { nodeName } from '../nodeText'
import { treeStrings } from '../strings'

type Props = {
  open: boolean
  node: TreeNode | null
  onClose: () => void
  onDone: () => void
}

/** Gỡ người khỏi cây: ô thành ô trống đúng chỗ cũ, con cháu và vợ/chồng giữ nguyên (#61). */
export function RemoveMemberDialog({ open, node, onClose, onDone }: Props) {
  const s = treeStrings.remove
  const remove = useRemoveMember()
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    setError(null)
    onClose()
  }

  const confirm = async () => {
    if (!node) return
    setError(null)
    try {
      await remove.mutateAsync(node.id)
      onDone()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : s.failed)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      danger
      title={s.title}
      description={node ? s.description(nodeName(node)) : ''}
      confirmLabel={s.confirm}
      cancelLabel={s.cancel}
      loading={remove.isPending}
      error={error}
      onConfirm={() => void confirm()}
      onCancel={close}
    />
  )
}

/** Xóa ô trống, giữ nhánh (#85); lỗi của máy chủ hiện ngay trong hộp. */
export function DeleteSlotDialog({ open, node, onClose, onDone }: Props) {
  const s = treeStrings.deleteSlot
  const remove = useDeleteNode()
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    setError(null)
    onClose()
  }

  const confirm = async () => {
    if (!node) return
    setError(null)
    try {
      await remove.mutateAsync(node.id)
      onDone()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : s.failed)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      danger
      title={s.title}
      description={s.description}
      confirmLabel={s.confirm}
      cancelLabel={s.cancel}
      loading={remove.isPending}
      error={error}
      onConfirm={() => void confirm()}
      onCancel={close}
    />
  )
}
