import type { TreeNode } from '@/utils/tree'

export type Point = { x: number; y: number }

export type LayoutOptions = {
  /** Cỡ mỗi ô (pixel). Bỏ trống thì 200×72. */
  nodeWidth?: number
  nodeHeight?: number
  /** Cỡ riêng của từng ô (theo id ô), ghi đè cỡ mặc định. */
  nodeSizes?: ReadonlyMap<number, { width: number; height: number }>
  /** Các ô đang thu gọn: ẩn con cháu (vợ/chồng vẫn hiện). Id của ô vợ/chồng tính là của người thuộc dòng. */
  collapsedIds?: Iterable<number>
  /** Chỉ vẽ nhánh của ô này (ô vợ/chồng thì tính người thuộc dòng). Bỏ trống thì vẽ mọi cây. */
  rootNodeId?: number | null
  /** Số đời tối đa hiện ra, tính từ gốc đang vẽ (gốc là đời thứ nhất). Bỏ trống thì không giới hạn. */
  maxDepth?: number | null
  /** Ô bắt buộc phải hiện ra (tìm kiếm, "Xem trên cây"): tự mở các nhánh thu gọn chứa nó và nới `maxDepth`. */
  focusNodeId?: number | null
}

export type PlacedNode = {
  id: number
  node: TreeNode
  /** Góc trên trái của ô. */
  x: number
  y: number
  width: number
  height: number
  /** Đời thật (độ sâu trên cây rời), không phụ thuộc gốc đang vẽ. */
  generation: number
  /** Hàng hiển thị, từ 0 ở hàng trên cùng. */
  row: number
  kind: 'lineage' | 'spouse'
  /** Thứ tự vợ/chồng (chỉ ô vợ/chồng). */
  spouseOrder: number | null
  /** Ô thuộc dòng của ô vợ/chồng. */
  ownerId: number | null
  isRoot: boolean
  /** Số con trực tiếp trên cây (kể cả đang bị ẩn). */
  childCount: number
  /** Số con bị ẩn vì thu gọn hoặc vượt `maxDepth`; > 0 nghĩa là có thể mở rộng. */
  hiddenChildCount: number
}

export type LayoutEdge = {
  id: string
  /** `marriage`: người thuộc dòng → vợ/chồng. `pair-child`: trung điểm của cặp → con. `single-child`: một mình cha/mẹ → con. */
  kind: 'marriage' | 'pair-child' | 'single-child'
  /** Ô thuộc dòng (cha/mẹ hoặc người có vợ/chồng). */
  fromNodeId: number
  /** Vợ/chồng (`marriage`) hoặc con. */
  toNodeId: number
  /** Ô vợ/chồng tạo thành cặp (chỉ `pair-child`). */
  coParentNodeId: number | null
  /** Thứ tự vợ/chồng (chỉ `marriage`). */
  order: number | null
  /** Đường gấp khúc từ đầu đến cuối. */
  points: Point[]
  /** Điểm đặt nhãn thứ tự hôn nhân (chỉ `marriage`). */
  anchor: Point | null
}

export type LayoutGeneration = {
  generation: number
  row: number
  /** Tọa độ y của đỉnh hàng (cùng hệ với ô), để đồng bộ cột "Đời" bên trái. */
  y: number
  /** Chiều cao của hàng (bằng chiều cao ô). */
  height: number
}

export type LayoutResult = {
  nodes: PlacedNode[]
  edges: LayoutEdge[]
  generations: LayoutGeneration[]
  width: number
  height: number
}
