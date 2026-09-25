// Chuyển kết quả `layoutTree` thành nút và cạnh của React Flow. React Flow chỉ hiển thị (DECISIONS #34):
// tọa độ lấy nguyên từ layout, không tính lại ở đây.
import type { Edge, Node } from '@xyflow/react'
import type { AddOptions } from '@/utils/tree'
import type { LayoutEdge, LayoutResult, PlacedNode } from './layout/types'

/** Trạng thái của ô khi đang kéo một nhánh để chuyển (chỉ máy tính). */
export type DropState = 'none' | 'source' | 'valid' | 'invalid' | 'over-valid' | 'over-invalid'

export type MemberNodeData = {
  placed: PlacedNode
  /** Ô của tài khoản đang đăng nhập (đã liên kết "Tôi là ai"). */
  isMe: boolean
  selected: boolean
  highlighted: boolean
  drop: DropState
  /** Admin đang xem cây ở chế độ chỉnh sửa (hiện nút "⋯" trên ô trống). */
  admin: boolean
  /** Ba nút "+" nhanh của Admin (chỉ máy tính); `null` là không hiện. */
  add: AddOptions | null
  /** Ô này giữ nút "+ vợ/chồng" của người thuộc dòng `spouseAddFor`, ở phía `spouseAddSide`. */
  spouseAddFor: number | null
  spouseAddSide: 'left' | 'right' | null
}

export type MemberFlowNode = Node<MemberNodeData, 'member'>
export type TreeFlowEdge = Edge<{ edge: LayoutEdge }, 'tree'>

export type FlowUi = {
  selectedId: number | null
  highlightId: number | null
  meNodeId: number | null
  /** Ô đang được kéo và các ô thả được; `null` khi không kéo. */
  dragging: { id: number; valid: ReadonlySet<number>; overId: number | null } | null
  draggable: boolean
  admin: boolean
  /** Có hiện nút "+" nhanh không, và cho ô nào thì thêm được gì. */
  addOptionsOf: ((nodeId: number) => AddOptions) | null
  /** Số vợ/chồng hiện có của một người thuộc dòng (để biết người tiếp theo đứng bên nào). */
  spouseCountOf: (nodeId: number) => number
  /** Vị trí tạm của ô đang kéo. */
  dragPosition: { id: number; x: number; y: number } | null
}

function dropStateOf(id: number, dragging: FlowUi['dragging']): DropState {
  if (!dragging) return 'none'
  if (id === dragging.id) return 'source'
  const valid = dragging.valid.has(id)
  if (dragging.overId === id) return valid ? 'over-valid' : 'over-invalid'
  return valid ? 'valid' : 'invalid'
}

/** Ô nằm ngoài cùng của đơn vị về phía `side` giữ nút "+ vợ/chồng" (người tiếp theo sẽ đứng ở đó). */
function spouseAddHosts(layout: LayoutResult, ui: FlowUi): Map<number, { ownerId: number; side: 'left' | 'right' }> {
  const hosts = new Map<number, { ownerId: number; side: 'left' | 'right' }>()
  if (!ui.addOptionsOf) return hosts
  const byUnit = new Map<number, PlacedNode[]>()
  for (const placed of layout.nodes) {
    const unitId = placed.kind === 'lineage' ? placed.id : (placed.ownerId ?? placed.id)
    byUnit.set(unitId, [...(byUnit.get(unitId) ?? []), placed])
  }
  for (const [ownerId, boxes] of byUnit) {
    if (!ui.addOptionsOf(ownerId).spouse) continue
    // Người vợ/chồng thứ 1, 3, 5... đứng bên trái, thứ 2, 4... bên phải (khớp layoutTree)
    const side = ui.spouseCountOf(ownerId) % 2 === 0 ? 'left' : 'right'
    const sorted = [...boxes].sort((a, b) => a.x - b.x)
    const host = side === 'left' ? sorted[0] : sorted.at(-1)
    if (host) hosts.set(host.id, { ownerId, side })
  }
  return hosts
}

export function buildFlow(layout: LayoutResult, ui: FlowUi): { nodes: MemberFlowNode[]; edges: TreeFlowEdge[] } {
  const hosts = spouseAddHosts(layout, ui)
  const nodes = layout.nodes.map((placed): MemberFlowNode => {
    const moved = ui.dragPosition?.id === placed.id ? ui.dragPosition : null
    const host = hosts.get(placed.id)
    return {
      id: String(placed.id),
      type: 'member',
      position: { x: moved?.x ?? placed.x, y: moved?.y ?? placed.y },
      width: placed.width,
      height: placed.height,
      // Chỉ ô thuộc dòng kéo được: vợ/chồng đi theo người thuộc dòng (#61)
      draggable: ui.draggable && placed.kind === 'lineage',
      zIndex: placed.id === ui.dragPosition?.id ? 10 : 0,
      data: {
        placed,
        isMe: placed.id === ui.meNodeId,
        selected: placed.id === ui.selectedId,
        highlighted: placed.id === ui.highlightId,
        drop: dropStateOf(placed.id, ui.dragging),
        admin: ui.admin,
        add: ui.addOptionsOf ? ui.addOptionsOf(placed.id) : null,
        spouseAddFor: host?.ownerId ?? null,
        spouseAddSide: host?.side ?? null,
      },
    }
  })
  const edges = layout.edges.map(
    (edge): TreeFlowEdge => ({
      id: edge.id,
      type: 'tree',
      source: String(edge.fromNodeId),
      target: String(edge.toNodeId),
      data: { edge },
      selectable: false,
      focusable: false,
    }),
  )
  return { nodes, edges }
}
