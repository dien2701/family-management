// Thuật toán xếp vị trí cây (DECISIONS #34, IDEA §8): hàm thuần, kết quả xác định, không phụ thuộc React Flow.
//
// - Mỗi đời một hàng, cao bằng ô cao nhất của hàng; các ô trong hàng căn giữa theo chiều dọc. Ô có thể có cỡ riêng.
//   Đơn vị xếp là ô thuộc dòng cùng các vợ/chồng của nó, đứng thành một hàng ngang:
//   vợ/chồng thứ 1, 3, 5… ở bên trái, thứ 2, 4, 6… ở bên phải (càng về sau càng xa người thuộc dòng).
// - Con đi xuống từ trung điểm của đúng cặp (hai ô kề nhau). Cặp không kề nhau (từ vợ/chồng thứ 3) thì
//   đường hôn nhân đi vòng dưới các ô và con đi xuống từ giữa đường đó. Con không có cặp đi từ đáy ô cha/mẹ.
// - Anh em xếp theo `sortOrder`. Cây con được nén theo đường viền từng đời để không chồng lấn.
// - Các cây rời đặt cạnh nhau, không chui vào nhau.
import {
  buildTreeIndex,
  computeGenerations,
  getAncestors,
  lineageIdOf,
  type SpouseEntry,
  type TreeGraph,
  type TreeNode,
} from '@/utils/tree'
import type { LayoutEdge, LayoutOptions, LayoutResult, PlacedNode, Point } from './types'

export const LAYOUT = {
  nodeWidth: 200,
  nodeHeight: 72,
  /** Khoảng giữa hai ô cùng một đơn vị (chỗ đặt đường hôn nhân và nhãn thứ tự). */
  spouseGap: 48,
  /** Khoảng tối thiểu giữa hai cây con anh em (và giữa các nhánh chị em họ ở mọi đời). */
  siblingGap: 40,
  /** Khoảng giữa hai cây rời. */
  treeGap: 96,
  /** Khoảng trống giữa hai hàng đời (chỗ chạy đường nối con). */
  rowGap: 96,
  /** Lệch giữa các đường ngang khi một đơn vị có con thuộc nhiều cặp khác nhau. */
  laneStep: 8,
  /** Độ sâu mỗi tầng của đường hôn nhân đi vòng dưới các ô. */
  marriageLaneStep: 14,
} as const

type Contour = { left: number; right: number }[]

type Box = {
  node: TreeNode
  /** Lệch trái của ô so với mép trái đơn vị. */
  dx: number
  w: number
  h: number
  spouseOrder: number | null
  /** Số ô cách người thuộc dòng (0 là chính người thuộc dòng; 1 là kề nhau). */
  distance: number
}

/** Một ô thuộc dòng cùng vợ/chồng, và cây con phía dưới. Tọa độ x trong đơn vị lấy mép trái đơn vị làm gốc. */
type Unit = {
  lineage: TreeNode
  depth: number
  boxes: Box[]
  width: number
  lineageCx: number
  lineageH: number
  /** Điểm con đi xuống theo từng cặp: khóa là id ô vợ/chồng, `null` là một mình cha/mẹ. */
  sources: Map<number | null, { x: number; distance: number }>
  children: Unit[]
  /** Cặp của từng con, cùng thứ tự với `children`. */
  childSource: (number | null)[]
  /** Lệch trái của từng cây con so với mép trái đơn vị này (có thể âm). */
  childDx: number[]
  /** Đường viền cả cây con theo từng đời (phần tử 0 là hàng của chính đơn vị). */
  contour: Contour
  childCount: number
  hiddenChildCount: number
}

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length

export function layoutTree(graph: TreeGraph, options: LayoutOptions = {}): LayoutResult {
  const { spouseGap, siblingGap, treeGap, rowGap, laneStep, marriageLaneStep } = LAYOUT
  // Cỡ ô mặc định 200×72; giao diện truyền cỡ vừa với tên và cỡ riêng của từng ô (nếu có)
  const defaultW = options.nodeWidth ?? LAYOUT.nodeWidth
  const defaultH = options.nodeHeight ?? LAYOUT.nodeHeight
  const sizeOf = (node: TreeNode) => ({
    w: options.nodeSizes?.get(node.id)?.width ?? defaultW,
    h: options.nodeSizes?.get(node.id)?.height ?? defaultH,
  })
  const index = buildTreeIndex(graph)
  const generations = computeGenerations(index)

  // Gốc đang vẽ: một đơn vị nếu có `rootNodeId`, không thì mọi cây rời.
  const startNode = options.rootNodeId != null ? index.nodes.get(lineageIdOf(index, options.rootNodeId)) : undefined
  const viewRoots = (startNode ? [startNode] : index.roots).filter((n) => generations.has(n.id))
  const viewRootIds = new Set(viewRoots.map((n) => n.id))

  const collapsed = new Set<number>()
  for (const id of options.collapsedIds ?? []) collapsed.add(lineageIdOf(index, id))

  // `focusNodeId`: mở đường từ gốc đang vẽ tới ô đó và nới số đời cho vừa.
  let maxDepth = options.maxDepth ?? Infinity
  const forceOpen = new Set<number>()
  if (options.focusNodeId != null && index.nodes.has(options.focusNodeId)) {
    const focus = lineageIdOf(index, options.focusNodeId)
    const chain = [focus, ...getAncestors(index, focus).map((n) => n.id)]
    const rootPos = chain.findIndex((id) => viewRootIds.has(id))
    if (rootPos >= 0) {
      for (const id of chain.slice(1, rootPos + 1)) forceOpen.add(id)
      maxDepth = Math.max(maxDepth, rootPos + 1)
    }
  }

  // Chiều cao mỗi hàng đời = ô cao nhất của hàng
  const rowHeights: number[] = []

  const buildUnit = (lineage: TreeNode, depth: number, seen: Set<number>): Unit => {
    seen.add(lineage.id)

    // Vợ/chồng xen kẽ hai bên: thứ tự 1 bên trái, 2 bên phải, 3 bên trái (xa hơn)...
    const leftSpouses: SpouseEntry[] = []
    const rightSpouses: SpouseEntry[] = []
    ;(index.spousesOf.get(lineage.id) ?? []).forEach((s, i) => (i % 2 === 0 ? leftSpouses : rightSpouses).push(s))
    const slots = [
      ...leftSpouses.reverse().map((s) => ({ node: s.node, order: s.order as number | null })),
      { node: lineage, order: null as number | null },
      ...rightSpouses.map((s) => ({ node: s.node, order: s.order as number | null })),
    ]
    const lineageSlot = leftSpouses.length

    let cursor = 0
    const boxes: Box[] = slots.map((slot, j) => {
      const { w, h } = sizeOf(slot.node)
      const box: Box = { node: slot.node, dx: cursor, w, h, spouseOrder: slot.order, distance: Math.abs(j - lineageSlot) }
      cursor += w + spouseGap
      return box
    })
    const width = cursor - spouseGap
    const lineageBox = boxes[lineageSlot] as Box
    const lineageCx = lineageBox.dx + lineageBox.w / 2
    rowHeights[depth] = Math.max(rowHeights[depth] ?? 0, ...boxes.map((b) => b.h))

    const sources = new Map<number | null, { x: number; distance: number }>([[null, { x: lineageCx, distance: 0 }]])
    boxes.forEach((box, j) => {
      if (box.distance === 0) return
      let x: number
      if (box.distance === 1) {
        // Kề nhau: con đi xuống từ giữa khe giữa hai ô
        const from = j < lineageSlot ? box.dx + box.w : lineageBox.dx + lineageBox.w
        const to = j < lineageSlot ? lineageBox.dx : box.dx
        x = (from + to) / 2
      } else {
        x = (lineageCx + box.dx + box.w / 2) / 2
      }
      sources.set(box.node.id, { x, distance: box.distance })
    })

    const allChildren = index.childrenOf.get(lineage.id) ?? []
    const expand =
      allChildren.length > 0 &&
      depth + 1 < maxDepth &&
      (!collapsed.has(lineage.id) || forceOpen.has(lineage.id))
    const kids = expand ? allChildren.filter((c) => !seen.has(c.id)) : []
    const children = kids.map((kid) => buildUnit(kid, depth + 1, seen))
    const childSource = kids.map((kid) => {
      const co = kid.coParentNodeId
      return co !== null && index.ownerOf.get(co) === lineage.id ? co : null
    })

    // Đặt các cây con sát nhau nhất có thể: mỗi cây con so với đường viền gộp của các cây con đã đặt.
    const running: Contour = []
    const offsets: number[] = []
    for (const child of children) {
      let x = 0
      if (offsets.length > 0) {
        x = -Infinity
        child.contour.forEach((c, d) => {
          const placed = running[d]
          if (placed) x = Math.max(x, placed.right + siblingGap - c.left)
        })
      }
      offsets.push(x)
      child.contour.forEach((c, d) => {
        const placed = running[d]
        running[d] = {
          left: placed ? Math.min(placed.left, x + c.left) : x + c.left,
          right: placed ? Math.max(placed.right, x + c.right) : x + c.right,
        }
      })
    }

    // Căn đơn vị sao cho điểm con đi xuống nằm giữa hàng con (từ con đầu tới con cuối).
    let shift = 0
    const contour: Contour = [{ left: 0, right: width }]
    if (children.length > 0) {
      const first = (offsets[0] ?? 0) + (children[0]?.lineageCx ?? 0)
      const last = (offsets.at(-1) ?? 0) + (children.at(-1)?.lineageCx ?? 0)
      const usedSources = [...new Set(childSource)]
      const anchorX = mean(usedSources.map((key) => sources.get(key)?.x ?? lineageCx))
      shift = anchorX - (first + last) / 2
      for (const c of running) contour.push({ left: c.left + shift, right: c.right + shift })
    }

    return {
      lineage,
      depth,
      boxes,
      width,
      lineageCx,
      lineageH: lineageBox.h,
      sources,
      children,
      childSource,
      childDx: offsets.map((x) => x + shift),
      contour,
      childCount: allChildren.length,
      hiddenChildCount: allChildren.length - kids.length,
    }
  }

  const visited = new Set<number>()
  const trees = viewRoots.map((r) => buildUnit(r, 0, visited))

  // Đỉnh từng hàng đời
  const rowTops: number[] = []
  rowHeights.reduce((top, h, row) => {
    rowTops[row] = top
    return top + h + rowGap
  }, 0)

  const nodes: PlacedNode[] = []
  const edges: LayoutEdge[] = []

  const emit = (unit: Unit, left: number) => {
    const top = rowTops[unit.depth] ?? 0
    const rowH = rowHeights[unit.depth] ?? defaultH
    const cy = top + rowH / 2
    const boxTop = (h: number) => top + (rowH - h) / 2
    const generation = generations.get(unit.lineage.id) ?? unit.depth + 1
    const lineageBox = unit.boxes.find((b) => b.node.id === unit.lineage.id) as Box
    const lineageCxAbs = left + unit.lineageCx
    const lineageBottom = boxTop(lineageBox.h) + lineageBox.h

    for (const box of unit.boxes) {
      const isLineage = box.node.id === unit.lineage.id
      nodes.push({
        id: box.node.id,
        node: box.node,
        x: left + box.dx,
        y: boxTop(box.h),
        width: box.w,
        height: box.h,
        generation,
        row: unit.depth,
        kind: isLineage ? 'lineage' : 'spouse',
        spouseOrder: box.spouseOrder,
        ownerId: isLineage ? null : unit.lineage.id,
        isRoot: isLineage && unit.lineage.parentNodeId === null,
        childCount: isLineage ? unit.childCount : 0,
        hiddenChildCount: isLineage ? unit.hiddenChildCount : 0,
      })
      if (box.distance === 0) continue
      const onLeft = box.dx < lineageBox.dx
      let points: Point[]
      let anchor: Point
      if (box.distance === 1) {
        // Kề nhau: đường thẳng qua khe giữa hai ô ở giữa hàng
        const from = left + (onLeft ? box.dx + box.w : lineageBox.dx + lineageBox.w)
        const to = left + (onLeft ? lineageBox.dx : box.dx)
        points = [
          { x: from, y: cy },
          { x: to, y: cy },
        ]
        anchor = { x: (from + to) / 2, y: cy }
      } else {
        // Không kề: đi vòng dưới các ô ở giữa
        const cx = left + box.dx + box.w / 2
        const laneY = top + rowH + marriageLaneStep * (box.distance - 1)
        points = [
          { x: lineageCxAbs, y: lineageBottom },
          { x: lineageCxAbs, y: laneY },
          { x: cx, y: laneY },
          { x: cx, y: boxTop(box.h) + box.h },
        ]
        anchor = { x: (lineageCxAbs + cx) / 2, y: laneY }
      }
      edges.push({
        id: `m-${unit.lineage.id}-${box.node.id}`,
        kind: 'marriage',
        fromNodeId: unit.lineage.id,
        toNodeId: box.node.id,
        coParentNodeId: null,
        order: box.spouseOrder,
        points,
        anchor,
      })
    }

    // Mỗi cặp một "làn" ngang riêng để đường nối của các cặp khác nhau không chập vào nhau.
    const lanes = [...new Set(unit.childSource)].sort(
      (a, b) => (unit.sources.get(a)?.x ?? 0) - (unit.sources.get(b)?.x ?? 0),
    )
    unit.children.forEach((child, i) => {
      const childLeft = left + (unit.childDx[i] ?? 0)
      const key = unit.childSource[i] ?? null
      const source = unit.sources.get(key) ?? { x: unit.lineageCx, distance: 0 }
      const fromY =
        source.distance === 0
          ? lineageBottom
          : source.distance === 1
            ? cy
            : top + rowH + marriageLaneStep * (source.distance - 1)
      const from: Point = { x: left + source.x, y: fromY }
      const childTop = rowTops[child.depth] ?? 0
      const childRowH = rowHeights[child.depth] ?? defaultH
      const toX = childLeft + child.lineageCx
      const toY = childTop + (childRowH - child.lineageH) / 2
      const busY = childTop - rowGap / 2 + (lanes.indexOf(key) - (lanes.length - 1) / 2) * laneStep
      edges.push({
        id: `c-${child.lineage.id}`,
        kind: key === null ? 'single-child' : 'pair-child',
        fromNodeId: unit.lineage.id,
        toNodeId: child.lineage.id,
        coParentNodeId: key,
        order: null,
        points:
          from.x === toX
            ? [from, { x: toX, y: toY }]
            : [from, { x: from.x, y: busY }, { x: toX, y: busY }, { x: toX, y: toY }],
        anchor: null,
      })
      emit(child, childLeft)
    })
  }

  // Các cây rời đặt cạnh nhau theo hộp bao của cả cây.
  let cursor = 0
  for (const tree of trees) {
    const bboxLeft = Math.min(...tree.contour.map((c) => c.left))
    const bboxRight = Math.max(...tree.contour.map((c) => c.right))
    const rootLeft = cursor - bboxLeft
    emit(tree, rootLeft)
    cursor = rootLeft + bboxRight + treeGap
  }

  nodes.sort((a, b) => a.y - b.y || a.x - b.x || a.id - b.id)

  const rows = rowHeights.length
  const firstGeneration = nodes.find((n) => n.row === 0)?.generation ?? 1
  return {
    nodes,
    edges,
    generations: Array.from({ length: rows }, (_, row) => ({
      generation: firstGeneration + row,
      row,
      y: rowTops[row] ?? 0,
      height: rowHeights[row] ?? defaultH,
    })),
    width: nodes.reduce((max, n) => Math.max(max, n.x + n.width), 0),
    height: rows > 0 ? (rowTops[rows - 1] ?? 0) + (rowHeights[rows - 1] ?? 0) : 0,
  }
}
