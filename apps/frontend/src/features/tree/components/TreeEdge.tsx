import type { EdgeProps } from '@xyflow/react'
import type { TreeFlowEdge } from '../flow'

// Đường nối vẽ đúng các điểm do `layoutTree` tính (hôn nhân kèm thứ tự, cặp cha–mẹ → con, một mình cha/mẹ → con),
// nét 1.5px theo DESIGN §6. Hôn nhân màu `tree-marriage`, nét đứt khi cặp không kề nhau (đường phải vòng, #100);
// cha mẹ–con màu `tree-line`. Không dùng đường cong mặc định của React Flow.
export function TreeEdge({ data }: EdgeProps<TreeFlowEdge>) {
  if (!data) return null
  const { edge } = data
  const marriage = edge.kind === 'marriage'
  const path = edge.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')
  const stroke = marriage ? 'stroke-tree-marriage' : 'stroke-tree-line'
  return (
    <g>
      <path
        d={path}
        fill="none"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeDasharray={marriage && edge.points.length > 2 ? '6 4' : undefined}
        className={stroke}
      />
      {edge.anchor && (
        <>
          <circle cx={edge.anchor.x} cy={edge.anchor.y} r={11} className={`fill-surface ${stroke}`} />
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
