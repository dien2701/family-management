import { Check, Search } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ModalDialog } from '@/components/shared/ModalDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/services/client'
import type { TreeNode } from '@/types/api'
import { cn } from '@/utils/cn'
import { toSearchName } from '@/utils/text'
import { checkMove, countBranch, getBranch, type TreeIndex } from '@/utils/tree'
import { useMoveNode } from '../hooks'
import { nodeName } from '../nodeText'
import { treeStrings } from '../strings'
import { ChoiceList } from './ChoiceList'

const s = treeStrings.move
const MAX_LISTED = 50

type MoveDialogProps = {
  open: boolean
  /** Ô thuộc dòng đang được chuyển (đi kèm vợ/chồng và con cháu). */
  nodeId: number | null
  index: TreeIndex
  generations: ReadonlyMap<number, number>
  /**
   * Nơi đến đã biết (kéo thả trên máy tính): số là ô cha/mẹ, `null` là thành gốc mới. Bỏ trống (`undefined`)
   * thì Admin chọn trong hộp (điện thoại dùng menu "Di chuyển nhánh").
   */
  initialTarget?: number | null
  onClose: () => void
  onDone: (node: TreeNode) => void
}

/**
 * Di chuyển nhánh (IDEA §8): chọn ô đến hoặc "Thành gốc mới", chọn cặp cha–mẹ nếu cần, rồi luôn có hộp xác nhận
 * ghi số người trong nhánh. Nơi dùng đặt `key` mới mỗi lần mở.
 */
export function MoveDialog({ open, nodeId, index, generations, initialTarget, onClose, onDone }: MoveDialogProps) {
  const searchId = useId()
  const move = useMoveNode()
  const node = nodeId === null ? undefined : index.nodes.get(nodeId)

  // Đã biết nơi đến từ kéo thả và không cần chọn cặp thì vào thẳng bước xác nhận
  const [direct] = useState(
    () => initialTarget !== undefined && nodeId !== null && checkMove(index, nodeId, initialTarget).ok,
  )
  const [target, setTarget] = useState<number | null | undefined>(initialTarget)
  const [coParentId, setCoParentId] = useState<number | null>(null)
  const [coParentError, setCoParentError] = useState<string | undefined>()
  const [stage, setStage] = useState<'pick' | 'confirm'>(direct ? 'confirm' : 'pick')
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Ô đến hợp lệ: ô thuộc dòng ngoài nhánh đang chuyển (chọn ô thuộc dòng thì cặp xác định theo vợ/chồng của nó)
  const candidates = useMemo(() => {
    if (nodeId === null) return []
    const inBranch = new Set(getBranch(index, nodeId).map((n) => n.id))
    const needle = toSearchName(query)
    return [...index.nodes.values()]
      .filter((n) => !index.ownerOf.has(n.id) && !inBranch.has(n.id) && generations.has(n.id))
      .filter((n) => !needle || toSearchName(nodeName(n)).includes(needle))
      .sort(
        (a, b) =>
          (generations.get(a.id) ?? 0) - (generations.get(b.id) ?? 0) ||
          nodeName(a).localeCompare(nodeName(b), 'vi') ||
          a.id - b.id,
      )
  }, [generations, index, nodeId, query])

  const coParentChoices = useMemo(() => {
    if (typeof target !== 'number') return []
    return (index.spousesOf.get(target) ?? []).map((sp) => ({
      value: sp.node.id,
      label: treeStrings.add.coParentOption(sp.order, nodeName(sp.node)),
    }))
  }, [index, target])
  const needsCoParent = typeof target === 'number' && coParentChoices.length >= 2

  const targetNode = typeof target === 'number' ? index.nodes.get(target) : undefined
  const canContinue = target !== undefined && (!needsCoParent || coParentId !== null)

  const close = () => {
    setError(null)
    onClose()
  }

  const goConfirm = () => {
    if (needsCoParent && coParentId === null) return setCoParentError(s.coParentRequired)
    setCoParentError(undefined)
    setStage('confirm')
  }

  const backFromConfirm = () => {
    setError(null)
    if (direct) close()
    else setStage('pick')
  }

  const confirm = async () => {
    if (nodeId === null || target === undefined) return
    setError(null)
    try {
      const moved = await move.mutateAsync({
        nodeId,
        input: { newParentNodeId: target, coParentNodeId: needsCoParent ? coParentId : null },
      })
      onDone(moved)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : s.failed)
    }
  }

  const name = node ? nodeName(node) : ''
  const branch = nodeId === null ? { people: 0, empty: 0 } : countBranch(index, nodeId)
  const targetText = targetNode ? s.targetChildOf(nodeName(targetNode)) : s.targetRoot

  return (
    <>
      <ModalDialog open={open && stage === 'pick'} title={s.title(name)} busy={move.isPending} onClose={close}>
        <p className="text-text-muted">{s.description}</p>

        <button
          type="button"
          aria-pressed={target === null}
          onClick={() => {
            setTarget(null)
            setCoParentId(null)
          }}
          className={cn(
            'flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-field border px-3 py-2 text-left transition-colors duration-200 ease-out',
            target === null ? 'border-primary bg-secondary' : 'border-border hover:bg-surface-muted',
          )}
        >
          <span>
            <span className="block font-semibold">{s.asRoot}</span>
            <span className="block text-sm text-text-muted">{s.asRootHint}</span>
          </span>
          {target === null && <Check className="size-5 shrink-0 text-primary" aria-hidden="true" />}
        </button>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={searchId} className="text-base font-medium">
            {s.search}
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <Input
              id={searchId}
              type="search"
              value={query}
              placeholder={s.searchPlaceholder}
              autoComplete="off"
              className="pl-10"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {candidates.length === 0 ? (
          <p className="py-4 text-center text-text-muted">{query.trim() ? s.noMatch : s.noTargets}</p>
        ) : (
          <ul aria-label={s.results} className="max-h-64 overflow-y-auto rounded-field border border-border md:max-h-72">
            {candidates.slice(0, MAX_LISTED).map((candidate) => {
              const selected = target === candidate.id
              return (
                <li key={candidate.id} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setTarget(candidate.id)
                      setCoParentId(null)
                      setCoParentError(undefined)
                    }}
                    className={cn(
                      'flex min-h-14 w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors duration-200 ease-out',
                      selected ? 'bg-secondary' : 'hover:bg-surface-muted',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold [overflow-wrap:anywhere]">{s.childOf(nodeName(candidate))}</span>
                      <span className="block text-sm text-text-muted">
                        {treeStrings.generation(generations.get(candidate.id) ?? 0)}
                      </span>
                    </span>
                    {selected && <Check className="size-5 shrink-0 text-primary" aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {needsCoParent && (
          <ChoiceList
            legend={s.coParentLabel}
            hint={s.coParentHint}
            error={coParentError}
            choices={coParentChoices}
            value={coParentId}
            onChange={(id) => {
              setCoParentId(id)
              setCoParentError(undefined)
            }}
          />
        )}

        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button variant="secondary" onClick={close}>
            {s.cancel}
          </Button>
          <Button disabled={!canContinue} onClick={goConfirm}>
            {s.next}
          </Button>
        </div>
      </ModalDialog>

      <ConfirmDialog
        open={open && stage === 'confirm'}
        title={s.confirmTitle}
        description={s.confirmDescription(name, branch.people, branch.empty, targetText)}
        confirmLabel={s.confirm}
        cancelLabel={direct ? s.cancel : s.back}
        loading={move.isPending}
        error={error}
        onConfirm={() => void confirm()}
        onCancel={backFromConfirm}
      />
    </>
  )
}
