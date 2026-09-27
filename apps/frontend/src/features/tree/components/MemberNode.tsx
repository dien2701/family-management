import { Handle, Position, useStore, type NodeProps } from '@xyflow/react'
import { Ellipsis, MoveDiagonal2, Plus } from 'lucide-react'
import { memo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { initialOf } from '@/utils/text'
import type { MemberFlowNode } from '../flow'
import { nodeName, yearsLines, yearsText } from '../nodeText'
import { treeStrings as t } from '../strings'
import { useTreeActions, type QuickAddKind } from '../treeActions'

// Ô thành viên theo DESIGN §6: 200×72, bo 12px, nền trắng, viền border; đã mất viền deceased + ✝;
// ô trống viền đứt; đang chọn viền accent 2px. Toàn bộ thân ô là vùng bấm.
const MIN_WIDTH = 72
const MIN_HEIGHT = 56
const MAX_SIZE = 520
const hiddenHandle = { opacity: 0, pointerEvents: 'none', width: 1, height: 1, minWidth: 0, minHeight: 0 } as const

/** Nút "+" nhỏ của Admin nằm trên viền ô (máy tính). Vùng bấm nới ra ngoài nhờ lớp `before`. */
function QuickAddButton({
  label,
  className,
  onClick,
}: {
  label: string
  className: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      // `nodrag nopan`: bấm nút không bị hiểu là kéo ô hay kéo nền
      className={cn(
        'nodrag nopan absolute z-10 flex size-6 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-text-muted shadow-card transition-colors duration-200 ease-out before:absolute before:-inset-2 before:content-[""] hover:border-primary hover:bg-primary hover:text-primary-fg',
        className,
      )}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <Plus className="size-4" aria-hidden="true" />
    </button>
  )
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  return url ? (
    <img src={url} alt="" draggable={false} className="size-10 shrink-0 rounded-full object-cover" />
  ) : (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-base font-semibold text-secondary-fg"
    >
      {initialOf(name)}
    </span>
  )
}

function Tag({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute z-10 max-w-[70%] truncate rounded-full px-2 text-sm leading-5 font-medium',
        className,
      )}
    >
      {children}
    </span>
  )
}

function MemberNodeView({ data }: NodeProps<MemberFlowNode>) {
  const { placed, isMe, selected, highlighted, drop, admin, add, spouseAddFor, spouseAddSide, vertical, scale } = data
  const actions = useTreeActions()
  const { node } = placed
  const member = node.member
  const empty = member === null
  const name = nodeName(node)
  const label = empty ? t.emptyNodeLabel(placed.generation) : t.nodeLabel(name, placed.generation)
  const firstLabel = member?.labels[0]
  const extraLabels = (member?.labels.length ?? 0) - 1

  const quickAdd = (kind: QuickAddKind, nodeId: number) => () => actions.quickAdd(kind, nodeId)

  // Kéo góc để đổi cỡ ô: trong lúc kéo chỉ ô này đổi hình, thả tay mới lưu và xếp lại cả cây
  const zoom = useStore((state) => state.transform[2])
  const [live, setLive] = useState<{ w: number; h: number } | null>(null)
  const dragStart = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const sizeAt = (e: PointerEvent) => {
    const start = dragStart.current
    if (!start) return null
    return {
      w: Math.round(Math.min(MAX_SIZE, Math.max(MIN_WIDTH, start.w + (e.clientX - start.x) / zoom))),
      h: Math.round(Math.min(MAX_SIZE, Math.max(MIN_HEIGHT, start.h + (e.clientY - start.y) / zoom))),
    }
  }
  const boxWidth = live?.w ?? placed.width
  const boxHeight = live?.h ?? placed.height
  const words = name.split(/\s+/).filter(Boolean)

  return (
    <div className="group relative h-full w-full">
      <Handle type="target" position={Position.Top} isConnectable={false} style={hiddenHandle} />
      <Handle type="source" position={Position.Bottom} isConnectable={false} style={hiddenHandle} />

      <button
        type="button"
        aria-label={label}
        aria-pressed={selected}
        title={empty && admin ? t.fillSlotHint : undefined}
        onClick={() => actions.open(placed.id)}
        // Nội dung vẽ ở cỡ chuẩn rồi phóng theo cỡ chung (Nhỏ/Vừa/Lớn); ô ngoài đã có đúng kích thước đã phóng
        style={{
          width: boxWidth / scale,
          height: boxHeight / scale,
          transform: scale === 1 ? undefined : `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        className={cn(
          'flex cursor-pointer overflow-hidden rounded-field border bg-surface text-left transition-[border-color,box-shadow,opacity,background-color] duration-200 ease-out hover:bg-surface-muted',
          vertical ? 'flex-col items-center gap-1 px-1 py-2' : 'items-center gap-2 px-2',
          member?.isDeceased ? 'border-deceased' : 'border-border',
          empty && 'border-dashed border-deceased bg-surface-muted',
          selected && 'border-2 border-accent',
          highlighted && 'ring-4 ring-accent/40',
          drop === 'valid' && 'ring-2 ring-accent ring-offset-2',
          drop === 'over-valid' && 'bg-secondary ring-4 ring-accent',
          drop === 'over-invalid' && 'ring-4 ring-danger',
          drop === 'invalid' && 'opacity-50',
          drop === 'source' && 'opacity-80 shadow-overlay',
        )}
      >
        {empty ? (
          <span
            className={cn(
              'flex-1 text-center text-base font-medium text-text-muted',
              vertical && 'flex items-center justify-center pb-10 [writing-mode:vertical-rl]',
            )}
          >
            {t.emptySlot}
          </span>
        ) : vertical ? (
          // Kiểu ảnh mẫu: mỗi từ của tên một dòng (chữ đứng thẳng), năm sinh–mất ở cuối ô
          <span className="flex min-h-0 w-full flex-1 flex-col items-center text-center">
            <span className="text-base leading-tight font-semibold">
              {words.map((word, i) => (
                <span key={`${i}-${word}`} className="block">
                  {word}
                </span>
              ))}
            </span>
            <span className="mt-auto pt-1 text-sm leading-tight text-text-muted tabular-nums">
              {yearsLines(member).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <>
            <Avatar name={name} url={member.avatarUrl} />
            <span className="min-w-0 flex-1">
              <span className="block text-base leading-tight font-semibold [overflow-wrap:anywhere]">{name}</span>
              <span className="block truncate text-sm text-text-muted tabular-nums">{yearsText(member)}</span>
            </span>
          </>
        )}
      </button>

      <button
        type="button"
        aria-label={t.resizeHandle(name)}
        title={t.resizeHint}
        className="nodrag nopan absolute -right-2 -bottom-2 z-10 flex size-7 cursor-nwse-resize touch-none items-center justify-center rounded-full border border-border bg-surface text-text-muted opacity-0 shadow-card transition-opacity duration-200 ease-out group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          e.stopPropagation()
          e.currentTarget.setPointerCapture(e.pointerId)
          dragStart.current = { x: e.clientX, y: e.clientY, w: placed.width, h: placed.height }
        }}
        onPointerMove={(e) => {
          const size = sizeAt(e)
          if (size) setLive(size)
        }}
        onPointerUp={(e) => {
          const size = sizeAt(e)
          dragStart.current = null
          setLive(null)
          if (size) actions.resize(placed.id, size.w, size.h)
        }}
        onPointerCancel={() => {
          dragStart.current = null
          setLive(null)
        }}
      >
        <MoveDiagonal2 className="size-4" aria-hidden="true" />
      </button>

      {isMe && <Tag className={cn('bg-primary text-primary-fg', vertical ? '-top-3 -left-2' : '-top-3 left-3')}>{t.isMe}</Tag>}
      {firstLabel && (
        <Tag className={cn('bg-warning-bg text-warning', vertical ? '-top-3 -right-2 max-w-[44px]' : '-top-3 right-3')}>
          {extraLabels > 0 ? `${firstLabel} +${extraLabels}` : firstLabel}
        </Tag>
      )}

      {empty && admin && (
        <button
          type="button"
          aria-label={t.moreActions}
          className={cn(
            'nodrag nopan absolute flex size-11 cursor-pointer items-center justify-center rounded-full text-text-muted hover:bg-secondary',
            vertical ? 'bottom-1 left-1/2 -translate-x-1/2' : 'top-1/2 right-1 -translate-y-1/2',
          )}
          onClick={(e) => {
            e.stopPropagation()
            actions.openMenu(placed.id)
          }}
        >
          <Ellipsis className="size-5" aria-hidden="true" />
        </button>
      )}

      {add && (
        <>
          <QuickAddButton
            label={t.add.quickChild}
            className="-bottom-3 left-1/2 -translate-x-1/2"
            onClick={quickAdd('child', placed.id)}
          />
          {add.parent && (
            <QuickAddButton
              label={t.add.quickParent}
              className="-top-3 left-1/2 -translate-x-1/2"
              onClick={quickAdd('parent', placed.id)}
            />
          )}
        </>
      )}
      {spouseAddFor !== null && spouseAddSide && (
        <QuickAddButton
          label={t.add.quickSpouse}
          className={cn('top-1/2 -translate-y-1/2', spouseAddSide === 'left' ? '-left-3' : '-right-3')}
          onClick={quickAdd('spouse', spouseAddFor)}
        />
      )}

      {placed.hiddenChildCount > 0 && (
        <button
          type="button"
          aria-label={t.expandHidden(placed.hiddenChildCount)}
          className="nodrag nopan absolute top-full left-1/2 mt-5 h-8 -translate-x-1/2 cursor-pointer rounded-full border border-border bg-surface px-3 text-sm font-medium whitespace-nowrap text-accent-text shadow-card transition-colors duration-200 ease-out before:absolute before:-inset-2 before:content-[''] hover:bg-secondary"
          onClick={(e) => {
            e.stopPropagation()
            actions.expandHidden(placed.id)
          }}
        >
          {t.hiddenChildren(placed.hiddenChildCount)}
        </button>
      )}
    </div>
  )
}

export const MemberNode = memo(MemberNodeView)
