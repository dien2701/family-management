import '@xyflow/react/dist/style.css'
import { MiniMap, ReactFlow, ReactFlowProvider, useReactFlow, type Node, type NodeChange } from '@xyflow/react'
import { ChevronsDown, ChevronsUp, Maximize, Minus, Plus, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cardTone, TONE_VARS, type TreePalette } from '../cardStyle'
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

type CanvasUi = Pick<
  FlowUi,
  'selectedId' | 'highlightId' | 'meNodeId' | 'draggable' | 'admin' | 'verticalOf' | 'scale' | 'card' | 'shape' | 'addOptionsOf' | 'spouseCountOf'
>

/** Màu ô trên MiniMap theo đúng tông của ô (biến CSS, nên đổi theo bảng màu và nền tối). */
const toneOf = (node: Node) => cardTone((node as MemberFlowNode).data.placed.node)
const miniFill = (node: Node) => `var(${TONE_VARS[toneOf(node)].bg})`
const miniStroke = (node: Node) => `var(${TONE_VARS[toneOf(node)].border})`

type TreeCanvasProps = {
  layout: LayoutResult
  ui: CanvasUi
  /** Bảng màu ô (hộp Cấu hình cây), đặt qua `data-tree-palette` trên khung sơ đồ. */
  palette: TreePalette
  onOpenConfig: () => void
  view: ViewRequest
  isDesktop: boolean
  /** Các ô thả được khi đang kéo một nhánh; `null` khi không kéo. */
  dragValid: ReadonlySet<number> | null
  onDragStart: (nodeId: number) => void
  onDragEnd: () => void
  /** Thả nhánh `nodeId` lên ô `targetId` (`null` là thả ra chỗ trống). */
  onDrop: (nodeId: number, targetId: number | null) => void
  onPaneClick: () => void
  /** Nút thêm vào đầu và cuối thanh công cụ dọc góc dưới trái (điện thoại: tìm, xem cây, "..."). */
  toolsStart?: ReactNode
  toolsEnd?: ReactNode
  /** Máy tính, thanh công cụ đã thu gọn: sơ đồ tràn sát mép nên bỏ viền và bo góc. */
  flat?: boolean
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

/** Một nút trong thanh công cụ dọc ở góc dưới trái sơ đồ (vùng chạm 44px). */
export function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-11 cursor-pointer items-center justify-center text-text transition-colors duration-200 ease-out hover:bg-surface-muted focus-visible:relative focus-visible:z-10 [&_svg]:size-5"
    >
      {children}
    </button>
  )
}

function TreeCanvasInner({
  layout,
  ui,
  palette,
  onOpenConfig,
  view,
  isDesktop,
  dragValid,
  onDragStart,
  onDragEnd,
  onDrop,
  onPaneClick,
  toolsStart,
  toolsEnd,
  flat = false,
}: TreeCanvasProps) {
  const { fitView, setCenter, zoomIn, zoomOut, screenToFlowPosition } = useReactFlow()
  const actions = useTreeActions()
  const [dragId, setDragId] = useState<number | null>(null)
  const [overId, setOverId] = useState<number | null>(null)
  const [toolsOpen, setToolsOpen] = useState(true)
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

  // Bề ngang vùng vẽ đổi (thu gọn/mở menu trái, đổi cỡ cửa sổ) thì vừa lại cả cây cho ô to rõ theo chỗ mới
  const regionRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = regionRef.current
    if (!el) return
    let width = el.clientWidth
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === width) return
      width = el.clientWidth
      void fitView({ ...FIT, duration: prefersReducedMotion() ? 0 : 250 })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [fitView])

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
    <div
      data-tree-palette={palette}
      className={cn(
        'flex h-full min-h-0 overflow-hidden bg-surface-muted',
        !flat && 'md:rounded-card md:border md:border-border',
      )}
    >
      <GenerationGutter generations={layout.generations} />
      <div ref={regionRef} className="relative h-full min-w-0 flex-1" role="region" aria-label={t.canvasLabel}>
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
            // Không bật onlyRenderVisibleElements: nó ẩn dây khi ô hai đầu ra ngoài khung nhìn
            attributionPosition="top-left"
          >
            {/* Bản đồ thu nhỏ: điện thoại cũng hiện theo mẫu (thay quyết định ẩn ở #100), cỡ nhỏ hơn cho đỡ chiếm chỗ */}
            <MiniMap
              className="overflow-hidden rounded-field border border-border shadow-card"
              style={isDesktop ? undefined : { width: 120, height: 90 }}
              bgColor="var(--color-surface)"
              // Mặc định React Flow là lớp phủ trắng mờ: lấy theo nền trang để giao diện tối không ra ô trắng
              maskColor="color-mix(in srgb, var(--color-bg) 65%, transparent)"
              nodeColor={miniFill}
              nodeStrokeColor={miniStroke}
              nodeStrokeWidth={4}
              nodeBorderRadius={8}
              ariaLabel={t.miniMap}
              pannable
              zoomable
            />
          </ReactFlow>
        </TreeActionsContext.Provider>

        {/* Một thanh dọc liền ở góc dưới trái: mọi nút công cụ của sơ đồ nằm ở đây */}
        {/* Nút thu gọn nằm cuối thanh nên vẫn đứng yên ở góc khi thanh co lại */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col divide-y divide-border overflow-hidden rounded-field border border-border bg-surface shadow-card">
          {toolsOpen && (
            <>
              {toolsStart}
              <ToolButton label="Phóng to" onClick={() => void zoomIn({ duration: 150 })}>
                <Plus aria-hidden="true" />
              </ToolButton>
              <ToolButton label="Thu nhỏ" onClick={() => void zoomOut({ duration: 150 })}>
                <Minus aria-hidden="true" />
              </ToolButton>
              <ToolButton label="Vừa khung nhìn" onClick={() => void fitView({ ...FIT, duration: 250 })}>
                <Maximize aria-hidden="true" />
              </ToolButton>
              <ToolButton label={t.config.open} onClick={onOpenConfig}>
                <SlidersHorizontal aria-hidden="true" />
              </ToolButton>
              {toolsEnd}
            </>
          )}
          <button
            type="button"
            aria-expanded={toolsOpen}
            aria-label={toolsOpen ? t.toolbar.collapseTools : t.toolbar.expandTools}
            title={toolsOpen ? t.toolbar.collapseTools : t.toolbar.expandTools}
            onClick={() => setToolsOpen((v) => !v)}
            className="flex size-11 cursor-pointer items-center justify-center text-text-muted transition-colors duration-200 ease-out hover:bg-surface-muted hover:text-text [&_svg]:size-5"
          >
            {toolsOpen ? <ChevronsDown aria-hidden="true" /> : <ChevronsUp aria-hidden="true" />}
          </button>
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
