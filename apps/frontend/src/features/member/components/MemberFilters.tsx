import { useEffect, useRef, useState } from 'react'
import { ArrowUpDown, Search, X } from 'lucide-react'
import { FilterChip } from '@/components/shared/FilterChip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { memberStrings } from '../strings'
import type { MemberListQuery } from '../api'

type MemberFiltersProps = {
  filters: MemberListQuery
  onChange: (updates: Partial<MemberListQuery>) => void
}

export function MemberFilters({ filters, onChange }: MemberFiltersProps) {
  const { list: str } = memberStrings

  // Ô tìm giữ state cục bộ: nếu gắn thẳng vào URL thì mỗi lần router cập nhật sẽ làm hỏng bộ gõ tiếng Việt (Telex/VNI)
  const [text, setText] = useState(filters.q ?? '')
  const lastPushed = useRef(filters.q ?? '')

  // Đồng bộ khi q đổi từ bên ngoài (nút Back, xóa bộ lọc...)
  useEffect(() => {
    if ((filters.q ?? '') !== lastPushed.current) {
      lastPushed.current = filters.q ?? ''
      setText(lastPushed.current)
    }
  }, [filters.q])

  // Đẩy lên URL sau khi ngừng gõ
  useEffect(() => {
    if (text === lastPushed.current) return
    const t = setTimeout(() => {
      lastPushed.current = text
      onChange({ q: text })
    }, 300)
    return () => clearTimeout(t)
  }, [text, onChange])

  const sortKey = filters.sort || 'name'
  const sortOptions = str.filters.sort.options
  // Đang xếp theo tuổi thì chip Sắp xếp để trống (tuổi có chip riêng)
  const currentSort =
    sortKey === 'age'
      ? undefined
      : (sortOptions.find((o) => o.sort === sortKey && (filters.dir ? o.dir === filters.dir : o.default)) ??
        sortOptions[0])
  const sortValue = currentSort ? `${currentSort.sort}:${currentSort.dir}` : ''
  const ageValue = sortKey === 'age' ? (filters.dir === 'asc' ? 'asc' : 'desc') : 'none'

  const deceasedValue = filters.deceased === undefined ? 'all' : filters.deceased ? 'dead' : 'alive'
  const onTreeValue = filters.onTree === undefined ? 'all' : filters.onTree ? 'yes' : 'no'
  const deceasedText = str.filters.deceased[deceasedValue]
  const onTreeText = str.filters.onTree[onTreeValue]
  const hasFilter = deceasedValue !== 'all' || onTreeValue !== 'all'

  return (
    // Điện thoại: ô tìm một hàng, chip lưới 2 cột. Từ md: tất cả một hàng, chip rộng cố định nên vị trí không xô
    <div className="mb-6 grid grid-cols-2 items-center gap-2 md:flex">
      <div className="relative col-span-2 min-w-0 md:min-w-40 md:flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-text-muted" />
        <Input
          type="text"
          placeholder={str.searchPlaceholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="pl-10"
        />
      </div>

        <FilterChip
          icon={ArrowUpDown}
          widthClass="md:w-48"
          label={str.filters.sort.label}
          face={currentSort?.face ?? str.filters.sort.label}
          active={currentSort !== undefined && !(currentSort.sort === 'name' && currentSort.default)}
          value={sortValue}
          options={sortOptions.map((o) => ({ value: `${o.sort}:${o.dir}`, text: o.option }))}
          onChange={(v) => {
            const o = sortOptions.find((s) => `${s.sort}:${s.dir}` === v)
            if (o) onChange({ sort: o.sort, dir: o.default ? undefined : o.dir })
          }}
        />

        <FilterChip
          widthClass="md:w-48"
          label={str.filters.age.label}
          face={ageValue === 'none' ? str.filters.age.label : str.filters.age[ageValue]}
          active={ageValue !== 'none'}
          value={ageValue}
          options={(['none', 'desc', 'asc'] as const).map((v) => ({ value: v, text: str.filters.age[v] }))}
          onChange={(v) =>
            onChange(
              v === 'none'
                ? { sort: undefined, dir: undefined }
                : { sort: 'age', dir: v === 'asc' ? 'asc' : undefined },
            )
          }
        />

        <FilterChip
          widthClass="md:w-36"
          label={str.filters.deceased.label}
          face={deceasedValue === 'all' ? str.filters.deceased.label : deceasedText}
          active={deceasedValue !== 'all'}
          value={deceasedValue}
          options={(['all', 'alive', 'dead'] as const).map((v) => ({ value: v, text: str.filters.deceased[v] }))}
          onChange={(v) => onChange({ deceased: v === 'all' ? undefined : v === 'dead' })}
        />

        <FilterChip
          widthClass="md:w-40"
          label={str.filters.onTree.label}
          face={onTreeValue === 'all' ? str.filters.onTree.label : onTreeText}
          active={onTreeValue !== 'all'}
          value={onTreeValue}
          options={(['all', 'yes', 'no'] as const).map((v) => ({ value: v, text: str.filters.onTree[v] }))}
          onChange={(v) => onChange({ onTree: v === 'all' ? undefined : v === 'yes' })}
        />

        {/* Luôn giữ chỗ, mờ khi chưa lọc; từ md chỉ còn biểu tượng để nhường chỗ cho ô tìm */}
        <Button
          variant="ghost"
          disabled={!hasFilter}
          aria-label={str.filters.clear}
          title={str.filters.clear}
          className="col-span-2 md:w-11 md:shrink-0 md:px-0"
          onClick={() => onChange({ deceased: undefined, onTree: undefined })}
        >
          <X aria-hidden />
          <span className="md:sr-only">{str.filters.clear}</span>
        </Button>
    </div>
  )
}
