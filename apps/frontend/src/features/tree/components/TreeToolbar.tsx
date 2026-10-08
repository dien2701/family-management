import { ChevronsDown, ListTree, Maximize2, Plus, Printer, RectangleHorizontal, RectangleVertical, RotateCcw, Search, UserRound } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'
import { toSearchName } from '@/utils/text'
import type { TreeIndex } from '@/utils/tree'
import type { TreeSize, TreeViewPrefs } from '../nodeSize'
import { nodeName, yearsText } from '../nodeText'
import { treeStrings } from '../strings'

const s = treeStrings.toolbar
const MAX_RESULTS = 8
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
  onPrint,
  onShowAll,
  onMoreDepth,
}: TreeToolbarProps) {
  const searchId = useId()
  const [query, setQuery] = useState('')

  // Chỉ người có trên cây (ô trống không có tên để tìm), xếp theo đời rồi theo tên
  const results = useMemo(() => {
    const needle = toSearchName(query)
    if (!needle) return []
    return [...index.nodes.values()]
      .filter((n) => n.member && toSearchName(n.member.fullName).includes(needle))
      .sort(
        (a, b) =>
          (generations.get(a.id) ?? 0) - (generations.get(b.id) ?? 0) ||
          nodeName(a).localeCompare(nodeName(b), 'vi'),
      )
  }, [generations, index, query])

  const pick = (nodeId: number) => {
    setQuery('')
    onPick(nodeId)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="relative flex flex-col gap-1.5 md:w-72 md:shrink-0">
          <label htmlFor={searchId} className="text-base font-medium whitespace-nowrap">
            {s.search}
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <Input
              id={searchId}
              type="search"
              value={query}
              placeholder={s.searchPlaceholder}
              autoComplete="off"
              className="pl-10"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                const first = results[0]
                if (e.key === 'Enter' && first) {
                  e.preventDefault()
                  pick(first.id)
                }
                if (e.key === 'Escape') setQuery('')
              }}
            />
          </div>
          {query.trim() && (
            <div className="absolute top-full right-0 left-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-field border border-border bg-surface shadow-overlay">
              {results.length === 0 ? (
                <p className="px-3 py-3 text-text-muted">{s.searchNoMatch}</p>
              ) : (
                <ul aria-label={s.searchResults}>
                  {results.slice(0, MAX_RESULTS).map((n) => (
                    <li key={n.id} className="border-b border-border last:border-b-0">
                      <button
                        type="button"
                        onClick={() => pick(n.id)}
                        className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left transition-colors duration-200 ease-out hover:bg-surface-muted"
                      >
                        <span className="min-w-0">
                          <span className="block font-semibold [overflow-wrap:anywhere]">{nodeName(n)}</span>
                          {n.member && (
                            <span className="block text-sm text-text-muted tabular-nums">{yearsText(n.member)}</span>
                          )}
                        </span>
                        <span className="shrink-0 text-sm font-medium text-text-muted tabular-nums">
                          {treeStrings.generation(generations.get(n.id) ?? 0)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-1 md:flex-wrap md:overflow-visible md:px-0 md:pb-0 [&>*]:shrink-0">
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
          <div role="group" aria-label={s.sizeGroup} className="flex items-center gap-1 rounded-button bg-secondary p-1">
            {SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={prefs.size === option.value}
                onClick={() => onPrefsChange({ size: option.value })}
                className={cn(
                  'min-h-9 min-w-11 cursor-pointer rounded-button px-3 text-base font-semibold transition-colors duration-200 ease-out',
                  prefs.size === option.value
                    ? 'bg-primary text-primary-fg'
                    : 'text-secondary-fg hover:bg-secondary-hover',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
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
