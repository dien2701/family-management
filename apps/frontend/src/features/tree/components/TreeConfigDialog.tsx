import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { ModalDialog } from '@/components/shared/ModalDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/utils/cn'
import { FILTERS, PALETTES, SHAPE_CLASS, SHAPES, type TreeCardFields } from '../cardStyle'
import type { TreeViewPrefs } from '../nodeSize'
import { treeStrings } from '../strings'

const s = treeStrings.config

type TreeConfigDialogProps = {
  open: boolean
  prefs: TreeViewPrefs
  onPrefsChange: (change: Partial<TreeViewPrefs>) => void
  onCardChange: (change: Partial<TreeCardFields>) => void
  onClose: () => void
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-base font-semibold">{title}</legend>
      {children}
      {hint && <p className="text-sm text-text-muted">{hint}</p>}
    </fieldset>
  )
}

/** Nút chọn một trong nhiều (aria-pressed), vùng bấm ≥44px. */
function Choice({ pressed, onClick, children, className }: { pressed: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-button border px-3 text-base font-medium transition-colors duration-200 ease-out',
        pressed ? 'border-primary bg-secondary text-secondary-fg' : 'border-border bg-surface hover:bg-surface-muted',
        className,
      )}
    >
      {children}
    </button>
  )
}

/**
 * Hộp "Cấu hình cây" (DECISIONS #100): lọc người, bật/tắt thông tin trên thẻ, bảng màu và hình dạng thẻ.
 * Lưu trên máy người xem (khóa `tocpha.tree.view`) nên khách cũng dùng được.
 */
export function TreeConfigDialog({ open, prefs, onPrefsChange, onCardChange, onClose }: TreeConfigDialogProps) {
  const filterLabel = { all: s.filterAll, male: s.filterMale, bloodline: s.filterBloodline }
  const filterHint = prefs.filter === 'male' ? s.filterMaleHint : prefs.filter === 'bloodline' ? s.filterBloodlineHint : undefined

  return (
    <ModalDialog open={open} title={s.title} onClose={onClose}>
      <Group title={s.filterGroup} hint={filterHint}>
        {/* Rộng theo chữ rồi chia phần dư: ba cột bằng nhau làm "Chỉ huyết thống" xuống dòng ở 375px */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Choice key={f} pressed={prefs.filter === f} onClick={() => onPrefsChange({ filter: f })} className="flex-auto whitespace-nowrap">
              {filterLabel[f]}
            </Choice>
          ))}
        </div>
      </Group>

      <Group title={s.cardGroup}>
        <div className="flex flex-col">
          <Checkbox label={s.cardPhoto} checked={prefs.card.photo} onChange={(e) => onCardChange({ photo: e.target.checked })} />
          <Checkbox label={s.cardLabels} checked={prefs.card.labels} onChange={(e) => onCardChange({ labels: e.target.checked })} />
          <Checkbox label={s.cardYears} checked={prefs.card.years} onChange={(e) => onCardChange({ years: e.target.checked })} />
        </div>
      </Group>

      <Group title={s.paletteGroup} hint={s.paletteHint}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PALETTES.map((p) => (
            <Choice key={p} pressed={prefs.palette === p} onClick={() => onPrefsChange({ palette: p })} className="justify-start">
              {/* Mẫu màu đọc đúng biến CSS của bảng nhờ data-tree-palette, không viết mã màu ở đây */}
              <span data-tree-palette={p} aria-hidden="true" className="flex gap-1">
                <span className="size-5 rounded-full border-2 border-tree-male bg-tree-male-bg" />
                <span className="size-5 rounded-full border-2 border-tree-female bg-tree-female-bg" />
              </span>
              <span className="flex-1 text-left">{s.palettes[p]}</span>
              {prefs.palette === p && <Check className="size-5" aria-hidden="true" />}
            </Choice>
          ))}
        </div>
      </Group>

      <Group title={s.shapeGroup}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SHAPES.map((shape) => (
            <Choice key={shape} pressed={prefs.shape === shape} onClick={() => onPrefsChange({ shape })} className="min-h-16 flex-col gap-1 py-2">
              <span aria-hidden="true" className={cn('h-6 w-9 border-2 border-tree-unknown bg-tree-unknown-bg', SHAPE_CLASS[shape])} />
              <span className="text-sm">{s.shapes[shape]}</span>
            </Choice>
          ))}
        </div>
      </Group>

      <Button className="w-full" onClick={onClose}>
        {s.close}
      </Button>
    </ModalDialog>
  )
}
