import { Loader2, Network, Plus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Alert } from '@/components/shared/Alert'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useMe } from '@/hooks/useMe'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTree, useTreeModel } from '@/hooks/useTree'
import {
  ancestorGraph,
  buildTreeIndex,
  checkMove,
  getAddOptions,
  getAncestors,
  lineageIdOf,
  type TreeIndex,
} from '@/utils/tree'
import { AddMemberDialog, type AddMode } from '../components/AddMemberDialog'
import { MoveDialog } from '../components/MoveDialog'
import { DeleteSlotDialog, RemoveMemberDialog } from '../components/NodeConfirmDialogs'
import { NodeMenuDialog, type MenuAction } from '../components/NodeMenuDialog'
import { PairDialog } from '../components/PairDialog'
import { ReorderDialog } from '../components/ReorderDialog'
import { TreeCanvas, type ViewRequest } from '../components/TreeCanvas'
import { TreeToolbar, type ViewStatus } from '../components/TreeToolbar'
import { layoutTree } from '../layout/layoutTree'
import { nodeName } from '../nodeText'
import { treeStrings as t } from '../strings'
import { TreeActionsContext, type QuickAddKind, type TreeActions } from '../treeActions'

/** Số đời hiện mặc định trên điện thoại (quanh người được chọn); chạm "+N con" để mở thêm. */
const PHONE_DEPTH = 3
const HIGHLIGHT_MS = 3000

/** Hộp thoại đang mở (một cái một lúc). */
type Flow =
  | { kind: 'menu'; nodeId: number }
  | { kind: 'add'; mode: AddMode }
  | { kind: 'move'; nodeId: number; target?: number | null }
  | { kind: 'reorder'; nodeId: number }
  | { kind: 'pair'; nodeId: number }
  | { kind: 'remove'; nodeId: number }
  | { kind: 'delete'; nodeId: number }

type Notice = { variant: 'danger' | 'info'; text: string; action?: { label: string; to: string } }

const EMPTY_INDEX = buildTreeIndex({ nodes: [], spouses: [] })

/** Cha/mẹ thuộc dòng của một ô (nếu là gốc thì chính nó): gốc của khung "3 đời quanh người này". */
function parentLineageOf(index: TreeIndex, nodeId: number): number {
  const lineage = lineageIdOf(index, nodeId)
  return index.nodes.get(lineage)?.parentNodeId ?? lineage
}

function EmptyTree({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState(0)
  const s = t.empty
  return (
    <>
      <EmptyState
        icon={Network}
        title={s.title}
        description={isAdmin ? s.adminDescription : s.description}
        action={
          isAdmin && (
            <Button
              onClick={() => {
                setSession((n) => n + 1)
                setOpen(true)
              }}
            >
              <Plus aria-hidden="true" />
              {t.toolbar.addRoot}
            </Button>
          )
        }
      />
      {isAdmin && (
        <AddMemberDialog
          key={session}
          open={open}
          mode={{ kind: 'root' }}
          index={EMPTY_INDEX}
          onClose={() => setOpen(false)}
          onDone={() => setOpen(false)}
        />
      )}
    </>
  )
}

type WorkspaceProps = {
  model: NonNullable<ReturnType<typeof useTreeModel>>
  isAdmin: boolean
  myMemberId: number | null
}

function TreeWorkspace({ model, isAdmin, myMemberId }: WorkspaceProps) {
  const { graph, index, generations } = model
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isPhone = !useMediaQuery('(min-width: 768px)')

  const myNodeId = myMemberId === null ? null : (index.nodeOfMember.get(myMemberId) ?? null)

  // Khung nhìn ban đầu: điện thoại hiện 3 đời quanh người được chọn (từ "Xem trên cây", không thì chính mình,
  // không thì gốc đầu tiên); máy tính vừa cả cây, hoặc nhảy tới người được chọn nếu có
  const [initial] = useState(() => {
    const param = Number(searchParams.get('o'))
    const fromLink = Number.isInteger(param) && index.nodes.has(param) ? param : null
    const anchor = fromLink ?? myNodeId ?? index.roots[0]?.id ?? null
    if (isPhone && anchor !== null) {
      return { anchor, highlight: fromLink, viewRoot: parentLineageOf(index, anchor), depth: PHONE_DEPTH as number | null }
    }
    return { anchor: fromLink, highlight: fromLink, viewRoot: null as number | null, depth: null as number | null }
  })

  const [viewRootId, setViewRootId] = useState<number | null>(initial.viewRoot)
  const [depthLimit, setDepthLimit] = useState<number | null>(initial.depth)
  const [focusId, setFocusId] = useState<number | null>(initial.anchor)
  const [highlightId, setHighlightId] = useState<number | null>(initial.highlight)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [collapsed, setCollapsed] = useState<ReadonlySet<number>>(() => new Set())
  const [ancestorsOf, setAncestorsOf] = useState<number | null>(null)
  const [view, setView] = useState<ViewRequest>({ tick: 1, nodeId: initial.anchor })
  const [flow, setFlow] = useState<Flow | null>(null)
  const [flowKey, setFlowKey] = useState(0)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)

  // Đang xem tổ tiên là một phần của cây nên không chỉnh sửa ở chế độ này
  const editing = isAdmin && ancestorsOf === null

  const layout = useMemo(
    () =>
      ancestorsOf === null
        ? layoutTree(graph, { collapsedIds: collapsed, rootNodeId: viewRootId, maxDepth: depthLimit, focusNodeId: focusId })
        : layoutTree(ancestorGraph(graph, ancestorsOf)),
    [graph, ancestorsOf, collapsed, viewRootId, depthLimit, focusId],
  )

  // ---- Điều khiển khung nhìn ----

  const requestView = (nodeId: number | null) => setView((v) => ({ tick: v.tick + 1, nodeId }))

  // Làm nổi bật rồi tự tắt sau vài giây
  const highlight = (nodeId: number) => {
    setHighlightId(nodeId)
    window.setTimeout(() => setHighlightId((current) => (current === nodeId ? null : current)), HIGHLIGHT_MS)
  }

  // Người được chọn từ liên kết "Xem trên cây" cũng chỉ nổi bật vài giây
  useEffect(() => {
    if (initial.highlight === null) return
    const id = window.setTimeout(() => setHighlightId(null), HIGHLIGHT_MS)
    return () => window.clearTimeout(id)
  }, [initial.highlight])

  /**
   * Đưa người tới màn hình: mở nhánh đang thu gọn (nhờ `focusId`), đổi gốc đang xem nếu người đó nằm ngoài, chọn và
   * làm nổi bật. `probe` là ô đã có trên cây dùng để biết người này nằm ở nhánh nào: bỏ trống thì dùng chính ô đó
   * (nếu đã có), `null` là chưa biết (người mới thành gốc).
   */
  const reveal = (nodeId: number, probe?: number | null) => {
    const known = probe === undefined ? (index.nodes.has(nodeId) ? nodeId : null) : probe
    setAncestorsOf(null)
    if (viewRootId !== null) {
      if (known === null || !index.nodes.has(known)) {
        setViewRootId(isPhone ? nodeId : null)
      } else {
        const lineage = lineageIdOf(index, known)
        const chain = [lineage, ...getAncestors(index, lineage).map((n) => n.id)]
        if (!chain.includes(viewRootId)) setViewRootId(isPhone ? parentLineageOf(index, lineage) : null)
      }
    }
    setFocusId(nodeId)
    setSelectedId(nodeId)
    highlight(nodeId)
    requestView(nodeId)
  }

  const showAll = () => {
    setAncestorsOf(null)
    setViewRootId(null)
    setDepthLimit(null)
    setCollapsed(new Set())
    setFocusId(null)
    setNotice(null)
    requestView(null)
  }

  const viewFrom = (nodeId: number) => {
    setAncestorsOf(null)
    setViewRootId(lineageIdOf(index, nodeId))
    setDepthLimit(null)
    setFocusId(null)
    setSelectedId(nodeId)
    requestView(null)
  }

  const showMyAncestors = () => {
    if (myMemberId === null) {
      setNotice({ variant: 'info', text: t.toolbar.notLinked, action: { label: t.toolbar.notLinkedAction, to: '/them/toi-la-ai' } })
    } else if (myNodeId === null) {
      setNotice({ variant: 'info', text: t.toolbar.notOnTree })
    } else {
      setNotice(null)
      setSelectedId(null)
      setAncestorsOf(myNodeId)
      requestView(null)
    }
  }

  const toggleCollapse = (nodeId: number) => {
    const id = lineageIdOf(index, nodeId)
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })
    setFocusId(null)
  }

  // "+N con": mở nhánh đang thu gọn và/hoặc nới số đời vừa đủ để thấy con của ô này
  const expandHidden = (nodeId: number) => {
    const placed = layout.nodes.find((n) => n.id === nodeId)
    setCollapsed((prev) => {
      if (!prev.has(nodeId)) return prev
      const next = new Set(prev)
      next.delete(nodeId)
      return next
    })
    if (depthLimit !== null && placed) setDepthLimit(Math.max(depthLimit, placed.row + 2))
    setFocusId(null)
  }

  // ---- Hộp thoại ----

  const openFlow = (next: Flow) => {
    setFlowKey((k) => k + 1)
    setFlow(next)
  }
  const closeFlow = () => setFlow(null)

  const openNode = (nodeId: number) => {
    setSelectedId(nodeId)
    setNotice(null)
    const empty = index.nodes.get(nodeId)?.memberId === null
    // Ô trống: Admin bấm vào là chọn người điền ngay (IDEA §8); người khác chỉ có menu xem
    if (empty && editing) openFlow({ kind: 'add', mode: { kind: 'fill', nodeId } })
    else openFlow({ kind: 'menu', nodeId })
  }

  const actions: TreeActions = {
    open: openNode,
    openMenu: (nodeId) => {
      setSelectedId(nodeId)
      openFlow({ kind: 'menu', nodeId })
    },
    quickAdd: (kind: QuickAddKind, nodeId) => {
      setSelectedId(nodeId)
      openFlow({ kind: 'add', mode: { kind, nodeId } })
    },
    expandHidden,
  }

  const menuNode = flow?.kind === 'menu' ? index.nodes.get(flow.nodeId) : undefined

  const onMenuAction = (action: MenuAction) => {
    if (flow?.kind !== 'menu' || !menuNode) return
    const nodeId = flow.nodeId
    switch (action) {
      case 'profile':
        closeFlow()
        if (menuNode.memberId !== null) void navigate(`/thanh-vien/${menuNode.memberId}`)
        break
      case 'viewFrom':
        closeFlow()
        viewFrom(nodeId)
        break
      case 'toggleCollapse':
        closeFlow()
        toggleCollapse(nodeId)
        break
      case 'fill':
        openFlow({ kind: 'add', mode: { kind: 'fill', nodeId } })
        break
      case 'addChild':
        openFlow({ kind: 'add', mode: { kind: 'child', nodeId } })
        break
      case 'addSpouse':
        openFlow({ kind: 'add', mode: { kind: 'spouse', nodeId } })
        break
      case 'addParent':
        openFlow({ kind: 'add', mode: { kind: 'parent', nodeId } })
        break
      case 'move':
        openFlow({ kind: 'move', nodeId })
        break
      case 'reorder':
        openFlow({ kind: 'reorder', nodeId })
        break
      case 'pair':
        openFlow({ kind: 'pair', nodeId })
        break
      case 'remove':
        openFlow({ kind: 'remove', nodeId })
        break
      case 'delete':
        openFlow({ kind: 'delete', nodeId })
        break
    }
  }

  const addMode = flow?.kind === 'add' ? flow.mode : null
  const onAddDone = (node: { id: number }) => {
    closeFlow()
    // Người mới thêm chưa có trong `index` hiện tại: dùng ô đã biết để xác định nhánh
    if (addMode?.kind === 'child' || addMode?.kind === 'spouse') reveal(node.id, addMode.nodeId)
    else if (addMode?.kind === 'fill') reveal(node.id)
    else reveal(node.id, null)
  }

  // ---- Kéo thả chuyển nhánh (máy tính) ----

  const dragValid = useMemo(() => {
    if (dragId === null) return null
    const valid = new Set<number>()
    for (const id of index.nodes.keys()) {
      const check = checkMove(index, dragId, id)
      // Nơi đến cần chọn cặp cha–mẹ vẫn là chỗ thả hợp lệ, hộp xác nhận sẽ hỏi tiếp
      if (check.ok || check.code === 'TREE_NEEDS_CO_PARENT') valid.add(id)
    }
    return valid
  }, [dragId, index])

  const onDrop = (nodeId: number, targetId: number | null) => {
    if (targetId === null) return
    const check = checkMove(index, nodeId, targetId)
    if (!check.ok && check.code !== 'TREE_NEEDS_CO_PARENT') {
      setNotice({ variant: 'danger', text: check.message })
      return
    }
    setNotice(null)
    openFlow({ kind: 'move', nodeId, target: targetId })
  }

  // ---- Dữ liệu cho sơ đồ ----

  const canvasUi = useMemo(
    () => ({
      selectedId,
      highlightId,
      meNodeId: myNodeId,
      draggable: editing && isDesktop,
      admin: editing,
      // Nút "+" nhỏ trên ô chỉ dùng được với chuột; điện thoại thêm qua menu của ô
      addOptionsOf: editing && isDesktop ? (id: number) => getAddOptions(index, id) : null,
      spouseCountOf: (id: number) => index.spousesOf.get(id)?.length ?? 0,
    }),
    [selectedId, highlightId, myNodeId, editing, isDesktop, index],
  )

  const viewRootNode = viewRootId === null ? undefined : index.nodes.get(viewRootId)
  const status: ViewStatus | null =
    ancestorsOf !== null
      ? { kind: 'ancestors' }
      : depthLimit !== null
        ? { kind: 'depth', depth: depthLimit }
        : viewRootNode
          ? { kind: 'from', name: nodeName(viewRootNode) }
          : null
  const canShowMoreDepth = ancestorsOf === null && depthLimit !== null && layout.nodes.some((n) => n.hiddenChildCount > 0)

  const moveFlow = flow?.kind === 'move' ? flow : null
  const flowNodeId = flow && flow.kind !== 'add' ? flow.nodeId : null
  const flowNode = flowNodeId === null ? null : (index.nodes.get(flowNodeId) ?? null)

  return (
    <TreeActionsContext.Provider value={actions}>
      <div className="flex flex-col gap-4">
        <TreeToolbar
          index={index}
          generations={generations}
          isAdmin={editing}
          status={status}
          canShowMoreDepth={canShowMoreDepth}
          onAddRoot={() => openFlow({ kind: 'add', mode: { kind: 'root' } })}
          onPick={(nodeId) => {
            setNotice(null)
            reveal(nodeId)
          }}
          onMyAncestors={showMyAncestors}
          onShowAll={showAll}
          onMoreDepth={() => setDepthLimit((d) => (d === null ? d : d + 1))}
        />

        {notice && (
          <div className="flex items-start gap-2">
            <Alert variant={notice.variant} className="flex-1">
              {notice.text}
              {notice.action && (
                <Link to={notice.action.to} className="ml-2 font-semibold underline">
                  {notice.action.label}
                </Link>
              )}
            </Alert>
            <Button variant="ghost" size="icon" aria-label={t.toolbar.dismiss} onClick={() => setNotice(null)}>
              <X />
            </Button>
          </div>
        )}
        {editing && isDesktop && <p className="text-sm text-text-muted">{t.toolbar.dragHint}</p>}

        <div className="h-[68dvh] min-h-[420px] md:h-[calc(100dvh-17rem)]">
          <TreeCanvas
            layout={layout}
            ui={canvasUi}
            view={view}
            isDesktop={isDesktop}
            dragValid={dragValid}
            onDragStart={setDragId}
            onDragEnd={() => setDragId(null)}
            onDrop={onDrop}
            onPaneClick={() => setSelectedId(null)}
          />
        </div>
      </div>

      <NodeMenuDialog
        open={flow?.kind === 'menu'}
        node={menuNode ?? null}
        index={index}
        generation={menuNode ? (generations.get(menuNode.id) ?? null) : null}
        isAdmin={editing}
        collapsed={menuNode ? collapsed.has(lineageIdOf(index, menuNode.id)) : false}
        onAction={onMenuAction}
        onClose={closeFlow}
      />
      <AddMemberDialog
        key={`add-${flowKey}`}
        open={flow?.kind === 'add'}
        mode={addMode}
        index={index}
        onClose={closeFlow}
        onDone={onAddDone}
      />
      <MoveDialog
        key={`move-${flowKey}`}
        open={flow?.kind === 'move'}
        nodeId={moveFlow?.nodeId ?? null}
        index={index}
        generations={generations}
        initialTarget={moveFlow?.target}
        onClose={closeFlow}
        onDone={(node) => {
          closeFlow()
          reveal(node.id, node.parentNodeId)
        }}
      />
      <ReorderDialog open={flow?.kind === 'reorder'} nodeId={flow?.kind === 'reorder' ? flow.nodeId : null} index={index} onClose={closeFlow} />
      <PairDialog
        key={`pair-${flowKey}`}
        open={flow?.kind === 'pair'}
        nodeId={flow?.kind === 'pair' ? flow.nodeId : null}
        index={index}
        onClose={closeFlow}
        onDone={closeFlow}
      />
      <RemoveMemberDialog open={flow?.kind === 'remove'} node={flowNode} onClose={closeFlow} onDone={closeFlow} />
      <DeleteSlotDialog open={flow?.kind === 'delete'} node={flowNode} onClose={closeFlow} onDone={closeFlow} />
    </TreeActionsContext.Provider>
  )
}

export function TreePage() {
  const tree = useTree()
  const me = useMe()
  const isAdmin = useAuth().user?.systemRole === 'ADMIN'
  const model = useTreeModel(tree.data)

  if (tree.isLoading || me.isLoading) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-16 text-text-muted">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
        <span>{t.loading}</span>
      </div>
    )
  }

  if (tree.isError || !model) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Alert className="w-full">{t.loadFailed}</Alert>
        <Button variant="secondary" onClick={() => void tree.refetch()}>
          {t.retry}
        </Button>
      </div>
    )
  }

  if (model.graph.nodes.length === 0) return <EmptyTree isAdmin={isAdmin} />

  return <TreeWorkspace model={model} isAdmin={isAdmin} myMemberId={me.data?.memberId ?? null} />
}
