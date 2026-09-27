import type { EdgeProps } from '@xyflow/react'
import type { TreeFlowEdge } from '../flow'

// Đường nối vẽ đúng các điểm do `layoutTree` tính (hôn nhân kèm thứ tự, cặp cha–mẹ → con, một mình cha/mẹ → con),
// nét 1.5px màu `tree-line` theo DESIGN §6. Không dùng đường cong mặc định của React Flow.
export function TreeEdge({ data }: EdgeProps<TreeFlowEdge>) {
  if (!data) return null
  const { edge } = data
  const path = edge.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')
  return (
    <g>
      <path d={path} fill="none" strokeWidth={1.5} strokeLinejoin="round" className="stroke-tree-line" />
      {edge.anchor && (
        <>
          <circle cx={edge.anchor.x} cy={edge.anchor.y} r={11} className="fill-surface stroke-tree-line" />
          <text
            x={edge.anchor.x}
            y={edge.anchor.y + 4}
            textAnchor="middle"
            className="fill-text-muted text-xs font-semibold"
          >
            {`⚭${edge.order ?? ''}`}
          </text>
        </>
      )}
    </g>
  )
}
