import { Loader2, Printer } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert } from '@/components/shared/Alert'
import { FormField } from '@/components/shared/FormField'
import { ModalDialog } from '@/components/shared/ModalDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select } from '@/components/ui/select'
import { cn } from '@/utils/cn'
import { toSearchName } from '@/utils/text'
import type { TreeGraph, TreeIndex } from '@/utils/tree'
import { layoutTree } from '../layout/layoutTree'
import { nodeName } from '../nodeText'
import { isAbort } from '../print/async'
import {
  planPages,
  planPng,
  sheetGeometry,
  type Orientation,
  type PaperSize,
  type PrintFormat,
  type PrintOptions,
} from '../print/geometry'
import { treeStrings } from '../strings'

const s = treeStrings.print

/** Dưới ngưỡng này ảnh PNG in ra khổ lớn sẽ bị vỡ nét. */
const LOW_DPI = 150

type SegmentedProps<T extends string> = {
  label: string
  value: T
  options: { value: T; label: string }[]
  disabled?: boolean
  onChange: (value: T) => void
}

// Nhóm nút chọn một trong vài giá trị ngắn (khổ giấy, hướng, định dạng); mỗi nút ≥44px
function Segmented<T extends string>({ label, value, options, disabled, onChange }: SegmentedProps<T>) {
  return (
    <fieldset className="flex flex-col gap-1.5" disabled={disabled}>
      <legend className="mb-1.5 text-base font-medium">{label}</legend>
      <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-2">
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                'min-h-11 cursor-pointer rounded-button px-3 text-base font-semibold transition-colors duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50',
                selected
                  ? 'bg-primary text-primary-fg hover:bg-primary-hover'
                  : 'bg-secondary text-secondary-fg hover:bg-secondary-hover',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

type FormProps = {
  graph: TreeGraph
  index: TreeIndex
  generations: ReadonlyMap<number, number>
  defaultRootId: number | null
  onBusyChange: (busy: boolean) => void
  onClose: () => void
}

function PrintForm({ graph, index, generations, defaultRootId, onBusyChange, onClose }: FormProps) {
  // Gốc chọn được: người thuộc dòng (không phải vợ/chồng của ai), xếp theo đời rồi theo tên
  const roots = useMemo(
    () =>
      [...index.nodes.values()]
        .filter((n) => n.member && !index.ownerOf.has(n.id))
        .sort(
          (a, b) =>
            (generations.get(a.id) ?? 0) - (generations.get(b.id) ?? 0) ||
            toSearchName(nodeName(a)).localeCompare(toSearchName(nodeName(b)), 'vi'),
        ),
    [generations, index],
  )

  const [options, setOptions] = useState<PrintOptions>({
    rootNodeId: roots.some((n) => n.id === defaultRootId) ? defaultRootId : null,
    paper: 'A3',
    orientation: 'landscape',
    withPhotos: true,
    format: 'pdf',
  })
  const [stage, setStage] = useState<string | null>(null)
  const [message, setMessage] = useState<{ variant: 'danger' | 'info'; text: string } | null>(null)
  const controller = useRef<AbortController | null>(null)
  const busy = stage !== null

  const patch = (change: Partial<PrintOptions>) => {
    setOptions((current) => ({ ...current, ...change }))
    setMessage(null)
  }

  // Đóng hộp thoại (hoặc rời trang) thì dừng việc đang chạy
  useEffect(() => () => controller.current?.abort(), [])

  const layout = useMemo(() => layoutTree(graph, { rootNodeId: options.rootNodeId }), [graph, options.rootNodeId])
  const estimate = useMemo(() => {
    const sheet = sheetGeometry(layout)
    return { pages: planPages(sheet, options), png: planPng(sheet, options) }
  }, [layout, options])

  const people = layout.nodes.filter((n) => n.node.member !== null).length
  const orientationText = options.orientation === 'landscape' ? s.landscape.toLowerCase() : s.portrait.toLowerCase()
  const pageCount = estimate.pages.cols * estimate.pages.rows
  const rootNode = options.rootNodeId === null ? undefined : index.nodes.get(options.rootNodeId)
  const rootName = rootNode ? nodeName(rootNode) : null

  const start = async () => {
    const abort = new AbortController()
    controller.current = abort
    setMessage(null)
    setStage(s.stages.fonts)
    onBusyChange(true)
    try {
      const { runPrint } = await import('../print/runPrint')
      const { blob, fileName } = await runPrint({ layout, options, rootName, signal: abort.signal, onStage: setStage })
      download(blob, fileName)
      setMessage({ variant: 'info', text: s.done })
    } catch (error) {
      setMessage(isAbort(error) ? { variant: 'info', text: s.aborted } : { variant: 'danger', text: s.failed })
    } finally {
      controller.current = null
      setStage(null)
      onBusyChange(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        void start()
      }}
    >
      <FormField label={s.root} hint={s.rootHint}>
        <Select
          value={options.rootNodeId ?? ''}
          disabled={busy}
          onChange={(e) => patch({ rootNodeId: e.target.value === '' ? null : Number(e.target.value) })}
        >
          <option value="">{s.rootAll}</option>
          {roots.map((n) => (
            <option key={n.id} value={n.id}>
              {s.rootOption(generations.get(n.id) ?? 0, nodeName(n))}
            </option>
          ))}
        </Select>
      </FormField>

      <Segmented<PaperSize>
        label={s.paper}
        value={options.paper}
        disabled={busy}
        options={[
          { value: 'A3', label: 'A3' },
          { value: 'A2', label: 'A2' },
        ]}
        onChange={(paper) => patch({ paper })}
      />
      <Segmented<Orientation>
        label={s.orientation}
        value={options.orientation}
        disabled={busy}
        options={[
          { value: 'landscape', label: s.landscape },
          { value: 'portrait', label: s.portrait },
        ]}
        onChange={(orientation) => patch({ orientation })}
      />
      <Segmented<PrintFormat>
        label={s.format}
        value={options.format}
        disabled={busy}
        options={[
          { value: 'pdf', label: 'PDF' },
          { value: 'png', label: 'PNG' },
        ]}
        onChange={(format) => patch({ format })}
      />

      <div>
        <Checkbox
          label={s.withPhotos}
          checked={options.withPhotos}
          disabled={busy}
          onChange={(e) => patch({ withPhotos: e.target.checked })}
        />
        <p className="text-sm text-text-muted">{s.photosHint}</p>
      </div>

      <div className="flex flex-col gap-1 rounded-field bg-surface-muted px-3 py-3 text-base">
        <p className="font-medium">{s.summary(people, layout.generations.length)}</p>
        <p className="text-text-muted tabular-nums">
          {options.format === 'pdf'
            ? s.pdfPlan(pageCount, options.paper, orientationText)
            : s.pngPlan(estimate.png.width, estimate.png.height, estimate.png.dpi)}
        </p>
      </div>
      {options.format === 'png' && estimate.png.dpi < LOW_DPI && <Alert variant="info">{s.pngLowDpi}</Alert>}

      {stage && (
        <p role="status" className="flex items-center gap-2 text-text-muted">
          <Loader2 className="size-5 shrink-0 animate-spin text-primary" aria-hidden="true" />
          {stage}
        </p>
      )}
      {message && <Alert variant={message.variant}>{message.text}</Alert>}

      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        {busy ? (
          <Button type="button" variant="secondary" onClick={() => controller.current?.abort()}>
            {s.stop}
          </Button>
        ) : (
          <Button type="button" variant="secondary" onClick={onClose}>
            {s.cancel}
          </Button>
        )}
        <Button type="submit" loading={busy}>
          {!busy && <Printer aria-hidden="true" />}
          {s.create}
        </Button>
      </div>
    </form>
  )
}

type PrintTreeDialogProps = {
  open: boolean
  graph: TreeGraph
  index: TreeIndex
  generations: ReadonlyMap<number, number>
  /** Gốc đang xem trên cây (nếu có) để chọn sẵn. */
  defaultRootId: number | null
  onClose: () => void
}

/** Hộp thoại "In cây": chọn gốc, khổ giấy, hướng, ảnh và định dạng, rồi tạo file ngay trên máy (PDF hoặc PNG). */
export function PrintTreeDialog({ open, onClose, ...form }: PrintTreeDialogProps) {
  const [busy, setBusy] = useState(false)
  return (
    <ModalDialog open={open} title={s.title} busy={busy} onClose={onClose}>
      <PrintForm {...form} onBusyChange={setBusy} onClose={onClose} />
    </ModalDialog>
  )
}
