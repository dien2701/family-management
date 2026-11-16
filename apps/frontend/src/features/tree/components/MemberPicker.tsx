import { Search } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'
import { toSearchName } from '@/utils/text'
import type { TreeIndex } from '@/utils/tree'
import { nodeName, yearsText } from '../nodeText'
import { treeStrings } from '../strings'

const MAX_RESULTS = 8

type MemberPickerProps = {
  index: TreeIndex
  generations: ReadonlyMap<number, number>
  label: string
  placeholder: string
  resultsLabel: string
  noMatch: string
  onPick: (nodeId: number) => void
  /** Người đang chọn: tên hiện trong ô khi không gõ. Bỏ trống thì ô tự xóa sau khi chọn (ô tìm trên cây). */
  selectedId?: number | null
  /** Danh sách kết quả nổi đè lên nội dung bên dưới (thanh công cụ) hay đẩy nội dung xuống (trong hộp thoại). */
  floating?: boolean
  className?: string
}

/** Ô chọn người có trên cây, tìm không dấu, kết quả xếp theo đời rồi theo tên. Ô trống không có tên nên không hiện. */
export function MemberPicker({
  index,
  generations,
  label,
  placeholder,
  resultsLabel,
  noMatch,
  onPick,
  selectedId = null,
  floating = true,
  className,
}: MemberPickerProps) {
  const inputId = useId()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(false)

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

  const selected = selectedId === null ? undefined : index.nodes.get(selectedId)
  const pick = (nodeId: number) => {
    setQuery('')
    setEditing(false)
    onPick(nodeId)
  }
  const open = editing && query.trim() !== ''

  return (
    <div className={cn('relative flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-base font-medium whitespace-nowrap">
        {label}
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        />
        <Input
          id={inputId}
          type="search"
          value={editing || !selected ? query : nodeName(selected)}
          placeholder={placeholder}
          autoComplete="off"
          className="pl-10"
          onFocus={() => setEditing(true)}
          onBlur={() => {
            if (!query.trim()) setEditing(false)
          }}
          onChange={(e) => {
            setEditing(true)
            setQuery(e.target.value)
          }}
          onKeyDown={(e) => {
            const first = results[0]
            if (e.key === 'Enter' && first) {
              e.preventDefault()
              pick(first.id)
            }
            if (e.key === 'Escape' && query) {
              // Esc lần đầu chỉ xóa chữ đang gõ, không đóng hộp thoại chứa ô này
              e.preventDefault()
              e.stopPropagation()
              setQuery('')
            }
          }}
        />
      </div>
      {open && (
        <div
          className={cn(
            'max-h-72 overflow-y-auto rounded-field border border-border bg-surface',
            floating && 'absolute top-full right-0 left-0 z-20 mt-1 shadow-overlay',
          )}
        >
          {results.length === 0 ? (
            <p className="px-3 py-3 text-text-muted">{noMatch}</p>
          ) : (
            <ul aria-label={resultsLabel}>
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
  )
}
