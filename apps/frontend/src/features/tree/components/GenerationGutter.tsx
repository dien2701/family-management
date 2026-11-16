import { useViewport } from '@xyflow/react'
import type { LayoutGeneration } from '../layout/types'
import { treeStrings as t } from '../strings'

/**
 * Cột trái cố định "Đời 01…N": mỗi đời một hàng, đồng bộ trục y với viewport (cùng gốc y với sơ đồ nên chỉ cần
 * nhân zoom và cộng độ lệch kéo). Chỉ để nhìn; thông tin đời của từng ô đã nằm trong nhãn đọc màn hình của ô.
 */
export function GenerationGutter({ generations }: { generations: LayoutGeneration[] }) {
  const { y, zoom } = useViewport()
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative w-[72px] shrink-0 overflow-hidden border-r border-border bg-surface-muted"
    >
      {generations.map((g) => (
        <div
          key={g.row}
          className="absolute inset-x-0 flex items-center justify-center"
          style={{ top: y + g.y * zoom, height: g.height * zoom }}
        >
          {/* Nhãn viên thuốc như bản mẫu (#100) */}
          <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-sm font-bold whitespace-nowrap text-text-muted tabular-nums shadow-card">
            {t.generation(g.generation)}
          </span>
        </div>
      ))}
    </div>
  )
}
