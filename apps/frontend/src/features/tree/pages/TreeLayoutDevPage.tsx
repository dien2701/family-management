// Trang /dev/cay (chỉ có ở dev): vẽ SVG thô kết quả layoutTree từ các đồ thị mẫu để tự kiểm bằng mắt.
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { buildTreeIndex, lineageIdOf } from '@/utils/tree'
import { LayoutSvg } from '../dev/LayoutSvg'
import { TREE_SAMPLES } from '../dev/samples'
import { layoutTree } from '../layout/layoutTree'
import { treeStrings } from '../strings'

const t = treeStrings.dev
const DEPTH_CHOICES = [1, 2, 3, 4]

export function TreeLayoutDevPage() {
  const [sampleId, setSampleId] = useState<string>(TREE_SAMPLES[0].id)
  const [collapsed, setCollapsed] = useState<ReadonlySet<number>>(new Set())
  const [rootId, setRootId] = useState<number | null>(null)
  const [maxDepth, setMaxDepth] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const sample = TREE_SAMPLES.find((s) => s.id === sampleId) ?? TREE_SAMPLES[0]
  const index = useMemo(() => buildTreeIndex(sample.graph), [sample])
  const layout = useMemo(
    () => layoutTree(sample.graph, { collapsedIds: collapsed, rootNodeId: rootId, maxDepth }),
    [sample, collapsed, rootId, maxDepth],
  )

  const chooseSample = (id: string) => {
    setSampleId(id)
    setCollapsed(new Set())
    setRootId(null)
    setMaxDepth(null)
    setSelectedId(null)
  }

  const selectedLineage = selectedId === null ? null : lineageIdOf(index, selectedId)
  const isCollapsed = selectedLineage !== null && collapsed.has(selectedLineage)
  const toggleCollapse = () => {
    if (selectedLineage === null) return
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (!next.delete(selectedLineage)) next.add(selectedLineage)
      return next
    })
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[1200px] flex-col gap-4 p-4 md:p-6">
      <header>
        <h1 className="text-xl font-bold md:text-2xl">{t.title}</h1>
        <p className="text-text-muted">{t.intro}</p>
      </header>

      <section aria-label={t.samples} className="flex flex-wrap gap-2">
        {TREE_SAMPLES.map((s) => (
          <Button
            key={s.id}
            variant={s.id === sample.id ? 'primary' : 'secondary'}
            aria-pressed={s.id === sample.id}
            onClick={() => chooseSample(s.id)}
          >
            {s.title}
          </Button>
        ))}
      </section>
      <p className="text-text-muted">{sample.description}</p>

      <section className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
        <label className="flex items-center gap-2">
          <span className="font-medium">{t.maxDepth}</span>
          <select
            className="min-h-11 rounded-field border border-border bg-surface-muted px-3"
            value={maxDepth ?? ''}
            onChange={(e) => setMaxDepth(e.target.value === '' ? null : Number(e.target.value))}
          >
            <option value="">{t.allDepth}</option>
            {DEPTH_CHOICES.map((n) => (
              <option key={n} value={n}>
                {t.depthOption(n)}
              </option>
            ))}
          </select>
        </label>
        <Button variant="secondary" onClick={toggleCollapse} disabled={selectedLineage === null}>
          {isCollapsed ? t.expand : t.collapse}
        </Button>
        <Button
          variant="secondary"
          onClick={() => selectedId !== null && setRootId(selectedId)}
          disabled={selectedId === null}
        >
          {t.viewFrom}
        </Button>
        <Button variant="ghost" onClick={() => setRootId(null)} disabled={rootId === null}>
          {t.viewAll}
        </Button>
        <span className={cn('text-sm', selectedId === null ? 'text-text-muted' : 'text-accent-text')}>
          {selectedId === null ? t.hint : t.selected(selectedId)}
        </span>
      </section>

      <div className="overflow-auto rounded-card border border-border bg-surface shadow-card">
        <LayoutSvg layout={layout} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
    </main>
  )
}
