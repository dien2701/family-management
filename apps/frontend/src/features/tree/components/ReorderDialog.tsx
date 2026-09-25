import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/shared/Alert'
import { ModalDialog } from '@/components/shared/ModalDialog'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/services/client'
import { cn } from '@/utils/cn'
import { checkReorder, getSiblings, type OrderDirection, type TreeIndex } from '@/utils/tree'
import { useReorderNode } from '../hooks'
import { nodeName } from '../nodeText'
import { treeStrings } from '../strings'

const s = treeStrings.order

type ReorderDialogProps = {
  open: boolean
  nodeId: number | null
  index: TreeIndex
  onClose: () => void
}

/** Đổi thứ tự anh em: mỗi lần bấm đổi chỗ với người kề bên; hộp giữ nguyên để bấm tiếp cho tới khi ưng ý. */
export function ReorderDialog({ open, nodeId, index, onClose }: ReorderDialogProps) {
  const reorder = useReorderNode()
  const [error, setError] = useState<string | null>(null)
  const node = nodeId === null ? undefined : index.nodes.get(nodeId)
  const siblings = nodeId === null ? [] : getSiblings(index, nodeId)
  const position = siblings.findIndex((n) => n.id === nodeId)

  const canMove = (direction: OrderDirection) => nodeId !== null && checkReorder(index, nodeId, direction).ok

  const move = async (direction: OrderDirection) => {
    if (nodeId === null) return
    setError(null)
    try {
      await reorder.mutateAsync({ nodeId, input: { direction } })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : s.failed)
    }
  }

  return (
    <ModalDialog
      open={open}
      title={s.title(node ? nodeName(node) : '')}
      busy={reorder.isPending}
      onClose={() => {
        setError(null)
        onClose()
      }}
    >
      <p className="text-text-muted">{s.description}</p>

      <ol aria-label={s.description} className="flex flex-col gap-1">
        {siblings.map((sibling) => (
          <li
            key={sibling.id}
            aria-current={sibling.id === nodeId ? 'true' : undefined}
            className={cn(
              'flex min-h-11 items-center rounded-field border px-3 py-2 [overflow-wrap:anywhere]',
              sibling.id === nodeId ? 'border-primary bg-secondary font-semibold' : 'border-border text-text-muted',
            )}
          >
            {nodeName(sibling)}
          </li>
        ))}
      </ol>
      {position >= 0 && <p className="text-sm text-text-muted tabular-nums">{s.position(position + 1, siblings.length)}</p>}

      {error && <Alert>{error}</Alert>}

      <div className="flex flex-col gap-2 md:flex-row">
        <Button
          variant="secondary"
          className="md:flex-1"
          disabled={!canMove('LEFT') || reorder.isPending}
          onClick={() => void move('LEFT')}
        >
          <ArrowLeft aria-hidden="true" />
          {s.left}
        </Button>
        <Button
          variant="secondary"
          className="md:flex-1"
          disabled={!canMove('RIGHT') || reorder.isPending}
          onClick={() => void move('RIGHT')}
        >
          {s.right}
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
      <Button
        onClick={() => {
          setError(null)
          onClose()
        }}
      >
        {s.close}
      </Button>
    </ModalDialog>
  )
}
