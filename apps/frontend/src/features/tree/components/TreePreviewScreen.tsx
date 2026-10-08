import { ChevronLeft, ChevronRight, Loader2, Maximize, Minus, Plus, Printer, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { Alert } from '@/components/shared/Alert'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select } from '@/components/ui/select'
import { cn } from '@/utils/cn'
import { toSearchName } from '@/utils/text'
import type { TreeGraph, TreeIndex } from '@/utils/tree'
import { layoutTree } from '../layout/layoutTree'
import type { LayoutOptions } from '../layout/types'
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
import type { PreparedScene } from '../print/runPrint'
import { renderSvg } from '../print/scene'
import { treeStrings } from '../strings'

const s = treeStrings.print
const p = s.preview

/** Dưới ngưỡng này ảnh PNG in ra khổ lớn sẽ bị vỡ nét. */
const LOW_DPI = 150
const MIN_ZOOM = 0.5
const MAX_ZOOM = 10

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

function RoundButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 cursor-pointer items-center justify-center rounded-button border border-border bg-surface text-text shadow-card transition-colors duration-200 ease-out hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  )
}

type ViewState = { zoom: number; x: number; y: number }
const HOME: ViewState = { zoom: 1, x: 0, y: 0 }

type ViewportProps = {
  svg: string
  width: number
  height: number
  /** Đổi giá trị này thì đưa khung nhìn về vừa màn hình. */
  resetKey: string
}

/** Vùng xem có kéo để di chuyển, cuộn chuột / chụm hai ngón / nút để phóng to; hiện một tờ giấy vừa khung khi mới mở. */
function PreviewViewport({ svg, width, height, resetKey }: ViewportProps) {
  const frame = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [view, setView] = useState<ViewState>(HOME)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<number | null>(null)

  useEffect(() => {
    const el = frame.current
    if (!el) return
    const observer = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }))
    observer.observe(el)
    setBox({ w: el.clientWidth, h: el.clientHeight })
    return () => observer.disconnect()
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- đặt lại khung nhìn khi resetKey đổi
  useEffect(() => setView(HOME), [resetKey])

  const fit = box.w > 0 && box.h > 0 ? Math.min((box.w * 0.96) / width, (box.h * 0.96) / height) : 1
  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))
  const zoomBy = (factor: number) => setView((v) => ({ ...v, zoom: clampZoom(v.zoom * factor) }))

  // Cuộn chuột để phóng to: cần listener không thụ động để chặn cuộn trang
  useEffect(() => {
    const el = frame.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setView((v) => ({ ...v, zoom: clampZoom(v.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)) }))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const distance = () => {
    const [a, b] = [...pointers.current.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : null
  }

  const onPointerDown = (e: ReactPointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    pinch.current = distance()
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    const last = pointers.current.get(e.pointerId)
    if (!last) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size >= 2) {
      const now = distance()
      if (now && pinch.current) zoomBy(now / pinch.current)
      pinch.current = now
      return
    }
    const dx = e.clientX - last.x
    const dy = e.clientY - last.y
    setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }))
  }
  const onPointerEnd = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId)
    pinch.current = distance()
  }

  return (
    <>
      <div
        ref={frame}
        role="img"
        aria-label={p.canvasLabel}
        className="absolute inset-0 cursor-grab touch-none overflow-hidden active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div
          className="absolute top-1/2 left-1/2 bg-surface shadow-overlay select-none"
          style={{
            width,
            height,
            transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${fit * view.zoom})`,
            transformOrigin: 'center',
          }}
          // SVG do chính bản in dựng, mọi chữ đã escape
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
      <div className="absolute right-3 bottom-3 z-10 flex flex-col gap-2">
        <RoundButton label={p.zoomIn} onClick={() => zoomBy(1.25)}>
          <Plus className="size-5" aria-hidden="true" />
        </RoundButton>
        <RoundButton label={p.zoomOut} onClick={() => zoomBy(1 / 1.25)}>
          <Minus className="size-5" aria-hidden="true" />
        </RoundButton>
        <RoundButton label={p.fit} onClick={() => setView(HOME)}>
          <Maximize className="size-5" aria-hidden="true" />
        </RoundButton>
      </div>
    </>
  )
}

type BodyProps = {
  graph: TreeGraph
  index: TreeIndex
  generations: ReadonlyMap<number, number>
  defaultRootId: number | null
  layoutOptions: Pick<LayoutOptions, 'nodeWidth' | 'nodeHeight' | 'nodeSizes'>
  verticalOf: (nodeId: number) => boolean
  onClose: () => void
}

type Prepared = { status: 'loading' } | { status: 'error' } | { status: 'ready'; prepared: PreparedScene }

function PreviewBody({ graph, index, generations, defaultRootId, layoutOptions, verticalOf, onClose }: BodyProps) {
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
  const [page, setPage] = useState(0)
  const [wholeSheet, setWholeSheet] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [prepared, setPrepared] = useState<Prepared>({ status: 'loading' })
  const [stage, setStage] = useState<string | null>(null)
  const [message, setMessage] = useState<{ variant: 'danger' | 'info'; text: string } | null>(null)
  const controller = useRef<AbortController | null>(null)
  const busy = stage !== null

  const patch = (change: Partial<PrintOptions>) => {
    setOptions((current) => ({ ...current, ...change }))
    setMessage(null)
  }

  // Đóng màn xem (hoặc rời trang) thì dừng việc đang chạy
  useEffect(() => () => controller.current?.abort(), [])

  const layout = useMemo(
    () => layoutTree(graph, { ...layoutOptions, rootNodeId: options.rootNodeId }),
    [graph, layoutOptions, options.rootNodeId],
  )
  const rootNode = options.rootNodeId === null ? undefined : index.nodes.get(options.rootNodeId)
  const rootName = rootNode ? nodeName(rootNode) : null

  // Dựng lại bản xem trước khi đổi gốc hoặc bật/tắt ảnh (đổi khổ giấy/hướng chỉ tính lại trang, không dựng lại)
  useEffect(() => {
    const abort = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- báo đang dựng lại trước khi tải bất đồng bộ
    setPrepared({ status: 'loading' })
    void (async () => {
      try {
        const { prepareScene } = await import('../print/runPrint')
        const result = await prepareScene({
          layout,
          withPhotos: options.withPhotos,
          verticalOf,
          rootName,
          signal: abort.signal,
          onStage: () => undefined,
        })
        if (!abort.signal.aborted) setPrepared({ status: 'ready', prepared: result })
      } catch (error) {
        if (!isAbort(error) && !abort.signal.aborted) setPrepared({ status: 'error' })
      }
    })()
    return () => abort.abort()
  }, [layout, options.withPhotos, rootName, verticalOf])

  const sheet = prepared.status === 'ready' ? prepared.prepared.scene.sheet : sheetGeometry(layout)
  const plan = useMemo(() => planPages(sheet, options), [sheet, options])
  const pngPlan = useMemo(() => planPng(sheet, options), [sheet, options])
  const pageCount = plan.cols * plan.rows
  const current = Math.min(page, pageCount - 1)
  const tiled = pageCount > 1

  // Trang đang xem (hoặc cả tờ) và SVG của nó: đúng phần sẽ ra giấy
  const view = wholeSheet
    ? { x: 0, y: 0, w: sheet.width, h: sheet.height }
    : { x: (current % plan.cols) * plan.tileW, y: Math.floor(current / plan.cols) * plan.tileH, w: plan.tileW, h: plan.tileH }
  const svg = useMemo(
    () =>
      prepared.status === 'ready'
        ? renderSvg(prepared.prepared.scene, view, { width: view.w, height: view.h }, { clip: tiled && !wholeSheet })
        : '',
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `view` suy ra từ các giá trị đã liệt kê
    [prepared, current, wholeSheet, plan, tiled],
  )

  const people = layout.nodes.filter((n) => n.node.member !== null).length
  const orientationText = options.orientation === 'landscape' ? s.landscape.toLowerCase() : s.portrait.toLowerCase()
  const ready = prepared.status === 'ready'

  const start = async () => {
    if (prepared.status !== 'ready') return
    const abort = new AbortController()
    controller.current = abort
    setMessage(null)
    setStage(s.stages.fonts)
    try {
      const { exportPrepared } = await import('../print/runPrint')
      const { blob, fileName } = await exportPrepared(prepared.prepared, options, abort.signal, setStage)
      download(blob, fileName)
      setMessage({ variant: 'info', text: s.done })
    } catch (error) {
      setMessage(isAbort(error) ? { variant: 'info', text: s.aborted } : { variant: 'danger', text: s.failed })
    } finally {
      controller.current = null
      setStage(null)
    }
  }

  return (
    <>
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <h2 className="text-lg leading-tight font-semibold">{s.title}</h2>
        <Button variant="ghost" size="icon" aria-label={p.close} disabled={busy} onClick={onClose}>
          <X />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative min-h-0 flex-1 bg-surface-muted">
          {ready ? (
            <PreviewViewport
              svg={svg}
              width={view.w}
              height={view.h}
              resetKey={`${options.paper}-${options.orientation}-${options.rootNodeId}-${current}-${wholeSheet}`}
            />
          ) : (
            <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-text-muted">
              {prepared.status === 'loading' ? (
                <>
                  <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
                  <p>{p.building}</p>
                </>
              ) : (
                <Alert variant="danger">{p.failed}</Alert>
              )}
            </div>
          )}

          {ready && (
            <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-button border border-border bg-surface px-1 py-1 shadow-card">
              {tiled && !wholeSheet && (
                <>
                  <Button variant="ghost" size="icon" aria-label={p.prevPage} disabled={current === 0} onClick={() => setPage(current - 1)}>
                    <ChevronLeft />
                  </Button>
                  <span className="min-w-20 text-center text-base font-medium tabular-nums" aria-live="polite">
                    {p.pageOf(current + 1, pageCount)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={p.nextPage}
                    disabled={current >= pageCount - 1}
                    onClick={() => setPage(current + 1)}
                  >
                    <ChevronRight />
                  </Button>
                </>
              )}
              {tiled && (
                <Button variant="ghost" onClick={() => setWholeSheet((v) => !v)}>
                  {wholeSheet ? p.singlePage : p.wholeSheet}
                </Button>
              )}
              {!tiled && <span className="px-3 text-base font-medium">{p.pageOf(1, 1)}</span>}
            </div>
          )}
        </div>

        <aside
          className={cn(
            'max-h-[45dvh] shrink-0 flex-col gap-4 overflow-y-auto border-t border-border p-4 md:flex md:max-h-none md:w-80 md:border-t-0 md:border-l',
            panelOpen ? 'flex' : 'hidden',
          )}
        >
          <p className="text-sm text-text-muted">{p.hint}</p>
          <FormField label={s.root} hint={s.rootHint}>
            <Select
              value={options.rootNodeId ?? ''}
              disabled={busy}
              onChange={(e) => {
                patch({ rootNodeId: e.target.value === '' ? null : Number(e.target.value) })
                setPage(0)
              }}
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
            onChange={(paper) => {
              patch({ paper })
              setPage(0)
            }}
          />
          <Segmented<Orientation>
            label={s.orientation}
            value={options.orientation}
            disabled={busy}
            options={[
              { value: 'landscape', label: s.landscape },
              { value: 'portrait', label: s.portrait },
            ]}
            onChange={(orientation) => {
              patch({ orientation })
              setPage(0)
            }}
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
                : s.pngPlan(pngPlan.width, pngPlan.height, pngPlan.dpi)}
            </p>
          </div>
          {options.format === 'png' && pngPlan.dpi < LOW_DPI && <Alert variant="info">{s.pngLowDpi}</Alert>}
        </aside>
      </div>

      <footer className="flex flex-col gap-2 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {stage && (
          <p role="status" className="flex items-center gap-2 text-text-muted">
            <Loader2 className="size-5 shrink-0 animate-spin text-primary" aria-hidden="true" />
            {stage}
          </p>
        )}
        {message && <Alert variant={message.variant}>{message.text}</Alert>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" className="mr-auto md:hidden" onClick={() => setPanelOpen((v) => !v)}>
            <SlidersHorizontal aria-hidden="true" />
            {panelOpen ? p.hideOptions : p.options}
          </Button>
          {busy ? (
            <Button type="button" variant="secondary" onClick={() => controller.current?.abort()}>
              {s.stop}
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={onClose}>
              {p.close}
            </Button>
          )}
          <Button type="button" loading={busy} disabled={!ready} onClick={() => void start()}>
            {!busy && <Printer aria-hidden="true" />}
            {p.print}
          </Button>
        </div>
      </footer>
    </>
  )
}

type TreePreviewScreenProps = BodyProps & { open: boolean }

/**
 * Màn "Xem cây" toàn màn hình: hiện đúng tờ sẽ in (theo gốc, khổ giấy, hướng, ảnh và cỡ/kiểu ô đang chỉnh), cho phóng
 * to, kéo xem, chuyển trang; thấy ổn mới bấm "In cây" để tạo file (PDF hoặc PNG) ngay trên máy.
 */
export function TreePreviewScreen({ open, onClose, ...body }: TreePreviewScreenProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog || typeof dialog.showModal !== 'function') return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Khóa cuộn nền khi đang mở
  useEffect(() => {
    if (!open) return
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = previous
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={s.title}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      className="m-0 h-dvh max-h-none w-dvw max-w-none flex-col border-0 bg-surface p-0 text-text backdrop:bg-text/40 open:flex"
    >
      {open && <PreviewBody {...body} onClose={onClose} />}
    </dialog>
  )
}
