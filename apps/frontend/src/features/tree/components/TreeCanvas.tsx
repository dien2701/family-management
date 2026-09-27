import '@xyflow/react/dist/style.css'
import { ReactFlow, ReactFlowProvider, useReactFlow, type NodeChange } from '@xyflow/react'
import { Maximize, Minus, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { buildFlow, type FlowUi, type MemberFlowNode } from '../flow'
import type { LayoutResult } from '../layout/types'
import { treeStrings as t } from '../strings'
import { TreeActionsContext, useTreeActions } from '../treeActions'
import { GenerationGutter } from './GenerationGutter'
import { MemberNode } from './MemberNode'
import { TreeEdge } from './TreeEdge'

const nodeTypes = { member: MemberNode }
const edgeTypes = { tree: TreeEdge }

const FIT = { padding: 0.15, minZoom: 0.3, maxZoom: 1 } as const

/** Yêu cầu đưa khung nhìn về một chỗ; `tick` tăng lên mỗi lần yêu cầu để canvas biết đã có yêu cầu mới. */
export type ViewRequest = { tick: number; nodeId: number | null }

type CanvasUi = Pick<FlowUi, 'selectedId' | 'highlightId' | 'meNodeId' | 'draggable' | 'admin' | 'verticalOf' | 'scale' | 'addOptionsOf' | 'spouseCountOf'>

type TreeCanvasProps = {
  layout: LayoutResult
  ui: CanvasUi
  view: ViewRequest
  isDesktop: boolean
  /** Các ô thả được khi đang kéo một nhánh; `null` khi không kéo. */
  dragValid: ReadonlySet<number> | null
  onDragStart: (nodeId: number) => void
  onDragEnd: () => void
  /** Thả nhánh `nodeId` lên ô `targetId` (`null` là thả ra chỗ trống). */
  onDrop: (nodeId: number, targetId: number | null) => void
  onPaneClick: () => void
}

/** Toạ độ con trỏ từ sự kiện chuột hoặc cảm ứng do React Flow chuyển lên. */
function pointOf(event: unknown): { x: number; y: number } | null {
  const e = event as Partial<MouseEvent> & Partial<TouchEvent>
  const touch = e.changedTouches?.[0] ?? e.touches?.[0]
  if (touch) return { x: touch.clientX, y: touch.clientY }
  return typeof e.clientX === 'number' && typeof e.clientY === 'number' ? { x: e.clientX, y: e.clientY } : null
}

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function ZoomButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-11 cursor-pointer items-center justify-center rounded-button border border-border bg-surface text-text shadow-card transition-colors duration-200 ease-out hover:bg-surface-muted"
    >
      {children}
    </button>
  )
}

function TreeCanvasInner({
  layout,
  ui,
  view,
  isDesktop,
  dragValid,
  onDragStart,
  onDragEnd,
  onDrop,
  onPaneClick,
}: TreeCanvasProps) {
  const { fitView, setCenter, zoomIn, zoomOut, screenToFlowPosition } = useReactFlow()
  const actions = useTreeActions()
  const [dragId, setDragId] = useState<number | null>(null)
  const [overId, setOverId] = useState<number | null>(null)
  const [dragPosition, setDragPosition] = useState<FlowUi['dragPosition']>(null)
  const justDragged = useRef(false)

  // Kéo xong trình duyệt vẫn bắn một cú "click" lên ô: bỏ qua để không mở menu ngay sau khi thả
  const guarded = useMemo(
    () => ({ ...actions, open: (id: number) => !justDragged.current && actions.open(id) }),
    [actions],
  )

  const { nodes, edges } = useMemo(
    () =>
      buildFlow(layout, {
        ...ui,
        dragging: dragId !== null && dragValid ? { id: dragId, valid: dragValid, overId } : null,
        dragPosition,
      }),
    [layout, ui, dragId, dragValid, overId, dragPosition],
  )

  // Đưa khung nhìn về ô cần xem (tìm kiếm, "Xem trên cây", mở cây) hoặc vừa cả cây
  const handledTick = useRef(0)
  useEffect(() => {
    if (handledTick.current === view.tick) return
    const frame = requestAnimationFrame(() => {
      handledTick.current = view.tick
      const duration = prefersReducedMotion() ? 0 : 250
      const target = view.nodeId === null ? undefined : layout.nodes.find((n) => n.id === view.nodeId)
      if (target) {
        void setCenter(target.x + target.width / 2, target.y + target.height / 2, {
          zoom: isDesktop ? 1 : 0.8,
          duration,
        })
      } else {
        void fitView({ ...FIT, duration })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [view, layout, isDesktop, fitView, setCenter])

  const nodeAt = useCallback(
    (event: unknown, excludeId: number): number | null => {
      const point = pointOf(event)
      if (!point) return null
      const p = screenToFlowPosition(point)
      const hit = layout.nodes.find(
        (n) => n.id !== excludeId && p.x >= n.x && p.x <= n.x + n.width && p.y >= n.y && p.y <= n.y + n.height,
      )
      return hit?.id ?? null
    },
    [layout, screenToFlowPosition],
  )

  const onNodesChange = useCallback((changes: NodeChange<MemberFlowNode>[]) => {
    for (const change of changes) {
      // Chỉ ô đang kéo mới đổi chỗ tạm; vị trí thật luôn lấy từ layout sau khi thao tác thành công
      if (change.type === 'position' && change.dragging && change.position) {
        setDragPosition({ id: Number(change.id), x: change.position.x, y: change.position.y })
      }
    }
  }, [])

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-card border border-border bg-surface-muted">
      <GenerationGutter generations={layout.generations} />
      <div className="relative h-full min-w-0 flex-1" role="region" aria-label={t.canvasLabel}>
        <TreeActionsContext.Provider value={guarded}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onNodeDragStart={(_, node) => {
              const id = Number(node.id)
              justDragged.current = true
              setDragId(id)
              onDragStart(id)
            }}
            onNodeDrag={(event, node) => setOverId(nodeAt(event, Number(node.id)))}
            onNodeDragStop={(event, node) => {
              const id = Number(node.id)
              const target = nodeAt(event, id)
              setDragId(null)
              setOverId(null)
              setDragPosition(null)
              onDragEnd()
              onDrop(id, target)
              // Cú click sinh ra sau khi thả xảy ra ngay trong lượt này
              setTimeout(() => {
                justDragged.current = false
              }, 0)
            }}
            onPaneClick={onPaneClick}
            // Ô không kéo được (vợ/chồng, hoặc người không phải Admin) mà không có onClick thì React Flow đặt
            // pointer-events: none cho cả ô nên bấm không ăn; bấm thật do nút trong ô xử lý
            onNodeClick={() => undefined}
            nodesDraggable={ui.draggable}
            nodesConnectable={false}
            nodesFocusable={false}
            edgesFocusable={false}
            elementsSelectable={false}
            selectNodesOnDrag={false}
            disableKeyboardA11y
            deleteKeyCode={null}
            selectionKeyCode={null}
            multiSelectionKeyCode={null}
            zoomOnDoubleClick={false}
            // Ngưỡng kéo để một cú chạm tay hơi rung không bị hiểu là kéo ô
            nodeDragThreshold={6}
            minZoom={0.15}
            maxZoom={1.5}
            onlyRenderVisibleElements
            attributionPosition="bottom-left"
          />
        </TreeActionsContext.Provider>

        <div className="absolute right-3 bottom-3 z-10 flex flex-col gap-2">
          <ZoomButton label="Phóng to" onClick={() => void zoomIn({ duration: 150 })}>
            <Plus className="size-5" aria-hidden="true" />
          </ZoomButton>
          <ZoomButton label="Thu nhỏ" onClick={() => void zoomOut({ duration: 150 })}>
            <Minus className="size-5" aria-hidden="true" />
          </ZoomButton>
          <ZoomButton label="Vừa khung nhìn" onClick={() => void fitView({ ...FIT, duration: 250 })}>
            <Maximize className="size-5" aria-hidden="true" />
          </ZoomButton>
        </div>
      </div>
    </div>
  )
}

/** Sơ đồ cây bằng React Flow: chỉ hiển thị kết quả `layoutTree`, mọi vị trí do layout quyết định. */
export function TreeCanvas(props: TreeCanvasProps) {
  return (
    <ReactFlowProvider>
      <TreeCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
