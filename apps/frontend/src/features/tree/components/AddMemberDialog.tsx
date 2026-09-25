import { useMemo, useState } from 'react'
import { MemberPickerDialog } from '@/components/shared/MemberPickerDialog'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { ApiError } from '@/services/client'
import type { MemberSummary, TreeNode } from '@/types/api'
import { getAddOptions, type TreeIndex } from '@/utils/tree'
import {
  useAddChild,
  useAddParent,
  useAddRoot,
  useAddSpouse,
  useFillSlot,
  useOffTreeSearch,
} from '../hooks'
import { nodeName } from '../nodeText'
import { treeStrings } from '../strings'
import { ChoiceList } from './ChoiceList'

const s = treeStrings.add

/** Một trong các cách đưa thành viên vào cây; `nodeId` là ô đang được thao tác. */
export type AddMode =
  | { kind: 'root' }
  | { kind: 'child' | 'spouse' | 'parent' | 'fill'; nodeId: number }

type AddMemberDialogProps = {
  open: boolean
  mode: AddMode | null
  index: TreeIndex
  onClose: () => void
  /** Thêm xong: trang Cây dùng ô mới để làm nổi bật và đưa khung nhìn tới đó. */
  onDone: (node: TreeNode) => void
}

/**
 * Hộp chọn **thành viên chưa có trên cây** (tìm không dấu, bottom sheet trên điện thoại) dùng cho cả năm cách
 * thêm: người gốc, con, vợ/chồng, cha/mẹ và điền vào ô trống. Nơi dùng đặt `key` mới mỗi lần mở để trạng thái
 * (ô tìm, người đã chọn) về ban đầu.
 */
export function AddMemberDialog({ open, mode, index, onClose, onDone }: AddMemberDialogProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<MemberSummary | null>(null)
  const [coParentId, setCoParentId] = useState<number | null>(null)
  const [coParentError, setCoParentError] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)

  const search = useOffTreeSearch(useDebouncedValue(query), open)
  const addRoot = useAddRoot()
  const addChild = useAddChild()
  const addSpouse = useAddSpouse()
  const addParent = useAddParent()
  const fillSlot = useFillSlot()
  const pending =
    addRoot.isPending || addChild.isPending || addSpouse.isPending || addParent.isPending || fillSlot.isPending

  const target = mode && mode.kind !== 'root' ? index.nodes.get(mode.nodeId) : undefined
  const targetName = target ? nodeName(target) : ''

  // Người có từ 2 vợ/chồng: phải chọn con này là con với ai (#60)
  const childOptions = mode?.kind === 'child' ? getAddOptions(index, mode.nodeId).child : null
  const coParentChoices = useMemo(() => {
    if (mode?.kind !== 'child' || !childOptions) return []
    const spouses = index.spousesOf.get(mode.nodeId) ?? []
    return childOptions.coParentChoices.map((node) => ({
      value: node.id,
      label: s.coParentOption(spouses.find((sp) => sp.node.id === node.id)?.order ?? 0, nodeName(node)),
    }))
  }, [childOptions, index, mode])
  const needsCoParent = childOptions?.needsCoParent === true

  const copy = (() => {
    switch (mode?.kind) {
      case 'child':
        return { title: s.childTitle(targetName), description: s.childDescription, confirm: s.confirm }
      case 'spouse':
        return { title: s.spouseTitle(targetName), description: s.spouseDescription, confirm: s.confirm }
      case 'parent':
        return { title: s.parentTitle(targetName), description: s.parentDescription, confirm: s.confirm }
      case 'fill':
        return { title: s.fillTitle, description: s.fillDescription, confirm: s.fillConfirm }
      default:
        return { title: s.rootTitle, description: s.rootDescription, confirm: s.confirm }
    }
  })()

  const submit = async () => {
    if (!mode || !selected) return
    if (needsCoParent && coParentId === null) return setCoParentError(s.coParentRequired)
    setError(null)
    setCoParentError(undefined)
    try {
      let node: TreeNode
      switch (mode.kind) {
        case 'root':
          node = await addRoot.mutateAsync(selected.id)
          break
        case 'child':
          node = await addChild.mutateAsync({
            nodeId: mode.nodeId,
            input: { memberId: selected.id, coParentNodeId: coParentId },
          })
          break
        case 'spouse':
          node = await addSpouse.mutateAsync({ nodeId: mode.nodeId, memberId: selected.id })
          break
        case 'parent':
          node = await addParent.mutateAsync({ nodeId: mode.nodeId, memberId: selected.id })
          break
        case 'fill':
          node = await fillSlot.mutateAsync({ nodeId: mode.nodeId, memberId: selected.id })
          break
      }
      onDone(node)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : s.failed)
    }
  }

  return (
    <MemberPickerDialog
      open={open}
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirm}
      labels={s.picker}
      query={query}
      onQueryChange={setQuery}
      members={search.data?.items ?? []}
      totalCount={search.data?.totalElements}
      loading={search.isFetching}
      loadFailed={search.isError}
      onRetry={() => void search.refetch()}
      selected={selected}
      onSelect={(member) => {
        setSelected(member)
        setError(null)
      }}
      error={error}
      submitting={pending}
      onConfirm={() => void submit()}
      onCancel={onClose}
    >
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
    </MemberPickerDialog>
  )
}
