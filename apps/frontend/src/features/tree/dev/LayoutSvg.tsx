// SVG thô để tự kiểm layout bằng mắt (Đợt 14). Đợt 15 thay bằng React Flow.
import type { KeyboardEvent } from 'react'
import { cn } from '@/utils/cn'
import { treeStrings } from '../strings'
import type { LayoutResult, PlacedNode } from '../layout/types'

const GUTTER = 88
const PAD = 24

type Props = {
  layout: LayoutResult
  selectedId: number | null
  onSelect: (id: number) => void
}

function years(node: PlacedNode): string {
  const member = node.node.member
  if (!member) return ''
  if (member.isDeceased) return `✝ ${member.deathYear ?? '?'}`
  return member.birthYear === null ? '' : String(member.birthYear)
}

export function LayoutSvg({ layout, selectedId, onSelect }: Props) {
  const width = GUTTER + layout.width + PAD
  const height = layout.height + PAD * 2
  const ox = GUTTER
  const oy = PAD
  const nodeH = layout.nodes[0]?.height ?? 0

  const onKey = (e: KeyboardEvent, id: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(id)
    }
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="group"
      aria-label={treeStrings.dev.diagramLabel}
      className="block max-w-none"
    >
      {layout.generations.map((g) => (
        <g key={g.row}>
          <line
            x1={0}
            x2={width}
            y1={oy + g.y + nodeH / 2}
            y2={oy + g.y + nodeH / 2}
            className="stroke-border"
            strokeDasharray="2 6"
          />
          <text x={PAD / 2} y={oy + g.y + nodeH / 2 + 5} className="fill-text-muted text-sm font-medium">
            {treeStrings.dev.generation(g.generation)}
          </text>
        </g>
      ))}

      {layout.edges.map((edge) => (
        <polyline
          key={edge.id}
          points={edge.points.map((p) => `${ox + p.x},${oy + p.y}`).join(' ')}
          fill="none"
          strokeWidth={1.5}
          strokeLinejoin="round"
          className="stroke-tree-line"
        />
      ))}

      {layout.edges.map(
        (edge) =>
          edge.anchor && (
            <g key={`o-${edge.id}`}>
              <circle cx={ox + edge.anchor.x} cy={oy + edge.anchor.y} r={11} className="fill-surface stroke-tree-line" />
              <text
                x={ox + edge.anchor.x}
                y={oy + edge.anchor.y + 4}
                textAnchor="middle"
                className="fill-text-muted text-xs font-semibold"
              >
                {`⚭${edge.order ?? ''}`}
              </text>
            </g>
          ),
      )}

      {layout.nodes.map((n) => {
        const empty = n.node.member === null
        const selected = n.id === selectedId
        const muted = empty || n.node.member?.isDeceased
        return (
          <g
            key={n.id}
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            aria-label={empty ? `Ô trống ${n.id}` : (n.node.member?.fullName ?? '')}
            className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-accent [&:focus-visible>rect]:stroke-2"
            onClick={() => onSelect(n.id)}
            onKeyDown={(e) => onKey(e, n.id)}
          >
            <rect
              x={ox + n.x}
              y={oy + n.y}
              width={n.width}
              height={n.height}
              rx={12}
              strokeWidth={selected ? 2 : 1}
              strokeDasharray={empty ? '6 4' : undefined}
              className={cn(
                'fill-surface',
                selected ? 'stroke-accent' : muted ? 'stroke-deceased' : 'stroke-border',
              )}
            />
            {!empty && (
              <>
                <text x={ox + n.x + 14} y={oy + n.y + 32} className="fill-text text-base font-semibold">
                  {n.node.member?.fullName}
                </text>
                <text
                  x={ox + n.x + 14}
                  y={oy + n.y + 54}
                  className={cn('text-sm', muted ? 'fill-deceased' : 'fill-text-muted')}
                >
                  {years(n)}
                </text>
              </>
            )}
            {n.hiddenChildCount > 0 && (
              <text
                x={ox + n.x + n.width / 2}
                y={oy + n.y + n.height + 20}
                textAnchor="middle"
                className="fill-accent-text text-sm font-medium"
              >
                {treeStrings.dev.hidden(n.hiddenChildCount)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
