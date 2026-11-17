import { ChevronDown, Search } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'
import { toSearchName } from '@/utils/text'
import type { TreeIndex } from '@/utils/tree'
import { nodeName } from '../nodeText'
import { treeStrings } from '../strings'

const s = treeStrings.kinship
const LIST_MAX = 320

type PersonSelectProps = {
  index: TreeIndex
  generations: ReadonlyMap<number, number>
  label: string
  selectedId: number | null
  /** Người đã chọn ở ô kia: không hiện trong danh sách để không chọn trùng. */
  excludeId?: number | null
  onPick: (nodeId: number) => void
}

/**
 * Ô chọn một người có trên cây (mẫu "Tính xưng hô"): bấm mở danh sách mọi người kèm ô tìm không dấu.
 * Danh sách đặt `position: fixed` theo vị trí ô để nổi ra ngoài phần cuộn của hộp thoại (popover của thư viện
 * gắn vào body sẽ nằm dưới lớp <dialog> modal). Cuộn hay đổi cỡ màn hình thì đóng, như ô chọn gốc của trình duyệt.
 */
export function PersonSelect({ index, generations, label, selectedId, excludeId = null, onPick }: PersonSelectProps) {
  const labelId = useId()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [style, setStyle] = useState<CSSProperties>({})

  // Mọi người có trên cây (bỏ ô trống), xếp theo đời rồi theo tên
  const people = useMemo(
    () =>
      [...index.nodes.values()]
        .flatMap((n) => (n.member && n.id !== excludeId ? [{ id: n.id, member: n.member }] : []))
        .sort(
          (a, b) =>
            (generations.get(a.id) ?? 0) - (generations.get(b.id) ?? 0) ||
            a.member.fullName.localeCompare(b.member.fullName, 'vi'),
        ),
    [excludeId, generations, index],
  )
  const results = useMemo(() => {
    const needle = toSearchName(query)
    return needle ? people.filter((p) => toSearchName(p.member.fullName).includes(needle)) : people
  }, [people, query])

  const close = (refocus: boolean) => {
    setOpen(false)
    setQuery('')
    if (refocus) triggerRef.current?.focus()
  }
  const pick = (nodeId: number) => {
    onPick(nodeId)
    close(true)
  }

  // Đặt danh sách ngay dưới ô; thiếu chỗ thì lật lên trên (bottom sheet trên điện thoại)
  const openList = () => {
    const r = triggerRef.current?.getBoundingClientRect()
    if (!r) return
    const below = window.innerHeight - r.bottom - 8
    const above = r.top - 8
    const up = below < 240 && above > below
    setStyle({
      left: r.left,
      width: r.width,
      maxHeight: Math.min(LIST_MAX, up ? above : below),
      ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    })
    setActive(Math.max(people.findIndex((p) => p.id === selectedId), 0))
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const dismiss = () => {
      setOpen(false)
      setQuery('')
    }
    const onScroll = (e: Event) => {
      if (!panelRef.current?.contains(e.target as Node)) dismiss()
    }
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) dismiss()
    }
    const onResize = dismiss
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    document.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  // Giữ mục đang chọn bằng phím luôn trong tầm nhìn
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active, listId, open])

  const selected = selectedId === null ? undefined : index.nodes.get(selectedId)

  return (
    <div ref={rootRef} className="flex min-w-0 flex-col gap-1.5">
      <span id={labelId} className="text-sm font-medium text-text-muted">
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        aria-describedby={selected ? undefined : `${labelId}-ph`}
        onClick={() => (open ? close(false) : openList())}
        className={cn(
          'flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-field border bg-surface px-3 text-left text-base transition-colors duration-200 ease-out hover:bg-surface-muted',
          open ? 'border-primary ring-2 ring-primary/30' : 'border-border',
        )}
      >
        {selected?.member ? (
          <>
            <UserAvatar url={selected.member.avatarUrl} name={selected.member.fullName} className="size-8 text-sm" />
            <span className="min-w-0 flex-1 truncate font-medium">{nodeName(selected)}</span>
          </>
        ) : (
          <span id={`${labelId}-ph`} className="min-w-0 flex-1 truncate text-text-muted">
            {s.choose}
          </span>
        )}
        <ChevronDown
          className={cn('size-5 shrink-0 text-text-muted transition-transform duration-200 motion-reduce:transition-none', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          style={style}
          className="fixed z-50 flex flex-col overflow-hidden rounded-field border border-border bg-surface shadow-overlay"
        >
          <div className="relative border-b border-border p-2">
            <Search
              className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <Input
              type="search"
              role="combobox"
              aria-label={s.search}
              aria-controls={listId}
              aria-expanded="true"
              aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
              autoFocus
              autoComplete="off"
              value={query}
              placeholder={s.searchPlaceholder}
              className="pl-10"
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                  e.preventDefault()
                  const step = e.key === 'ArrowDown' ? 1 : -1
                  setActive((i) => Math.min(Math.max(i + step, 0), Math.max(results.length - 1, 0)))
                } else if (e.key === 'Enter' && results[active]) {
                  e.preventDefault()
                  pick(results[active].id)
                } else if (e.key === 'Escape') {
                  // Esc chỉ đóng danh sách, không đóng hộp thoại chứa ô này
                  e.preventDefault()
                  e.stopPropagation()
                  close(true)
                } else if (e.key === 'Tab') {
                  close(false)
                }
              }}
            />
          </div>
          {results.length === 0 ? (
            <p className="px-3 py-3 text-text-muted">{s.noMatch}</p>
          ) : (
            <ul id={listId} role="listbox" aria-label={s.results} className="min-h-0 flex-1 overflow-y-auto py-1">
              {results.map((p, i) => (
                <li
                  key={p.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={p.id === selectedId}
                  onPointerMove={() => setActive(i)}
                  onClick={() => pick(p.id)}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center gap-3 px-3 py-1.5 transition-colors duration-150 ease-out',
                    i === active && 'bg-surface-muted',
                    p.id === selectedId && 'font-semibold text-primary',
                  )}
                >
                  <UserAvatar url={p.member.avatarUrl} name={p.member.fullName} className="size-8 text-sm" />
                  <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{p.member.fullName}</span>
                  {p.member.birthYear !== null && (
                    <span className="shrink-0 text-sm text-text-muted tabular-nums">{p.member.birthYear}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
