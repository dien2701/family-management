import { useState } from 'react'
import { ModalDialog } from '@/components/shared/ModalDialog'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/services/client'
import type { TreeNode } from '@/types/api'
import type { TreeIndex } from '@/utils/tree'
import { useSetCoParent } from '../hooks'
import { nodeName } from '../nodeText'
import { treeStrings } from '../strings'
import { ChoiceList } from './ChoiceList'

const s = treeStrings.pair

type PairDialogProps = {
  open: boolean
  nodeId: number | null
  index: TreeIndex
  onClose: () => void
  onDone: (node: TreeNode) => void
}

/** Đổi cặp cha–mẹ của một người con, chỉ trong các vợ/chồng của cha/mẹ hiện tại. Nơi dùng đặt `key` mới mỗi lần mở. */
export function PairDialog({ open, nodeId, index, onClose, onDone }: PairDialogProps) {
  const setCoParent = useSetCoParent()
  const node = nodeId === null ? undefined : index.nodes.get(nodeId)
  const parentId = node?.parentNodeId ?? null
  const spouses = parentId === null ? [] : (index.spousesOf.get(parentId) ?? [])
  const [value, setValue] = useState<number | null>(node?.coParentNodeId ?? null)
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    setError(null)
    onClose()
  }

  const submit = async () => {
    if (nodeId === null || value === null) return
    setError(null)
    try {
      onDone(await setCoParent.mutateAsync({ nodeId, input: { coParentNodeId: value } }))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : s.failed)
    }
  }

  return (
    <ModalDialog open={open} title={s.title(node ? nodeName(node) : '')} busy={setCoParent.isPending} onClose={close}>
      <ChoiceList
        legend={s.description}
        choices={spouses.map((sp) => ({
          value: sp.node.id,
          label: s.option(sp.order, nodeName(sp.node)),
          hint: sp.node.id === node?.coParentNodeId ? s.current : undefined,
        }))}
        value={value}
        disabled={setCoParent.isPending}
        onChange={setValue}
      />
      {error && (
        <p role="alert" className="text-base font-medium text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Button variant="secondary" disabled={setCoParent.isPending} onClick={close}>
          {s.cancel}
        </Button>
        <Button loading={setCoParent.isPending} disabled={value === null || value === node?.coParentNodeId} onClick={() => void submit()}>
          {s.confirm}
        </Button>
      </div>
    </ModalDialog>
  )
}
