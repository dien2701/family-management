import { ChevronsDown, HeartHandshake, ListTree, Maximize2, Plus, Printer, RectangleHorizontal, RectangleVertical, RotateCcw, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import type { TreeIndex } from '@/utils/tree'
import type { TreeSize, TreeViewPrefs } from '../nodeSize'
import { treeStrings } from '../strings'
import { MemberPicker } from './MemberPicker'

const s = treeStrings.toolbar
const SIZE_OPTIONS: { value: TreeSize; label: string }[] = [
  { value: 'small', label: s.sizeSmall },
  { value: 'medium', label: s.sizeMedium },
  { value: 'large', label: s.sizeLarge },
]

export type ViewStatus =
  | { kind: 'ancestors' }
  | { kind: 'from'; name: string }
  | { kind: 'depth'; depth: number }

type TreeToolbarProps = {
  index: TreeIndex
  generations: ReadonlyMap<number, number>
  isAdmin: boolean
  status: ViewStatus | null
  canShowMoreDepth: boolean
  prefs: TreeViewPrefs
  onPrefsChange: (change: Partial<TreeViewPrefs>) => void
  /** Có ô nào đã chỉnh riêng cỡ/kiểu không, và nút đặt lại tất cả. */
  hasNodeOverrides: boolean
  onResetNodes: () => void
  onAddRoot: () => void
  onPick: (nodeId: number) => void
  onMyAncestors: () => void
  onKinship: () => void
  onPrint: () => void
  onShowAll: () => void
  onMoreDepth: () => void
}

function statusText(status: ViewStatus): string {
  switch (status.kind) {
    case 'ancestors':
      return s.viewingAncestors
    case 'from':
      return s.viewingFrom(status.name)
    case 'depth':
      return s.viewingDepth(status.depth)
  }
}

/** Nhóm chọn cỡ ô Nhỏ/Vừa/Lớn, dùng ở thanh công cụ máy tính và bảng tùy chọn điện thoại. */
export function SizeGroup({ size, onChange }: { size: TreeSize; onChange: (size: TreeSize) => void }) {
  return (
    <div role="group" aria-label={s.sizeGroup} className="flex items-center gap-1 rounded-button bg-secondary p-1">
      {SIZE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={size === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'min-h-9 min-w-11 flex-1 cursor-pointer rounded-button px-3 text-base font-semibold transition-colors duration-200 ease-out',
            size === option.value ? 'bg-primary text-primary-fg' : 'text-secondary-fg hover:bg-secondary-hover',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** Ô tìm trên cây (nhảy tới người và làm nổi bật), tổ tiên của tôi, thêm người gốc (Admin) và trạng thái đang xem. */
export function TreeToolbar({
  index,
  generations,
  isAdmin,
  status,
  canShowMoreDepth,
  prefs,
  onPrefsChange,
  hasNodeOverrides,
  onResetNodes,
  onAddRoot,
  onPick,
  onMyAncestors,
  onKinship,
  onPrint,
  onShowAll,
  onMoreDepth,
}: TreeToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Điện thoại: ô tìm và các nút nằm trong thanh công cụ góc dưới trái sơ đồ (TreePhoneTools) */}
      <div className="hidden gap-3 md:flex md:flex-row md:items-end">
        <MemberPicker
          index={index}
          generations={generations}
          label={s.search}
          placeholder={s.searchPlaceholder}
          resultsLabel={s.searchResults}
          noMatch={s.searchNoMatch}
          onPick={onPick}
          className="md:w-72 md:shrink-0"
        />

        <div className="flex flex-1 flex-wrap gap-2">
          <Button variant="secondary" onClick={onKinship}>
            <HeartHandshake aria-hidden="true" />
            {s.kinship}
          </Button>
          <Button variant="secondary" onClick={onMyAncestors}>
            <UserRound aria-hidden="true" />
            {s.myAncestors}
          </Button>
          <Button variant="secondary" onClick={onPrint}>
            <Printer aria-hidden="true" />
            {s.print}
          </Button>
          <Button
            variant="secondary"
            aria-pressed={prefs.vertical}
            onClick={() => onPrefsChange({ vertical: !prefs.vertical })}
          >
            {prefs.vertical ? <RectangleHorizontal aria-hidden="true" /> : <RectangleVertical aria-hidden="true" />}
            {prefs.vertical ? s.horizontalView : s.verticalView}
          </Button>
          <SizeGroup size={prefs.size} onChange={(size) => onPrefsChange({ size })} />
          {hasNodeOverrides && (
            <Button variant="ghost" onClick={onResetNodes}>
              <RotateCcw aria-hidden="true" />
              {s.resetNodes}
            </Button>
          )}
          {isAdmin && (
            <Button onClick={onAddRoot}>
              <Plus aria-hidden="true" />
              {s.addRoot}
            </Button>
          )}
        </div>
      </div>

      {status && (
        <div role="status" className="flex flex-wrap items-center gap-2 rounded-field bg-secondary px-3 py-2 text-secondary-fg">
          <ListTree className="size-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 font-medium [overflow-wrap:anywhere]">{statusText(status)}</span>
          {canShowMoreDepth && (
            <Button variant="ghost" onClick={onMoreDepth}>
              <ChevronsDown aria-hidden="true" />
              {s.moreGenerations}
            </Button>
          )}
          <Button variant="ghost" onClick={onShowAll}>
            <Maximize2 aria-hidden="true" />
            {s.showAll}
          </Button>
        </div>
      )}
    </div>
  )
}
