import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
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

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:flex-wrap mb-6">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-text-muted pointer-events-none" />
        <Input
          type="text"
          placeholder={str.searchPlaceholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="grid grid-cols-1 gap-3 md:flex md:shrink-0">
        <Select
          value={filters.sort || 'name'}
          onChange={(e) => onChange({ sort: e.target.value as MemberListQuery['sort'] })}
          aria-label={str.filters.sort}
          className="md:w-44"
        >
          <option value="name">{str.filters.sortOptions.name}</option>
          <option value="age">{str.filters.sortOptions.age}</option>
          <option value="created">{str.filters.sortOptions.created}</option>
          <option value="generation">{str.filters.sortOptions.generation}</option>
        </Select>

        <Select
          value={filters.deceased === undefined ? 'all' : filters.deceased ? 'dead' : 'alive'}
          onChange={(e) => {
            const v = e.target.value
            onChange({ deceased: v === 'all' ? undefined : v === 'dead' })
          }}
          aria-label={str.filters.deceased.label}
          className="md:w-44"
        >
          <option value="all">{str.filters.deceased.all}</option>
          <option value="alive">{str.filters.deceased.alive}</option>
          <option value="dead">{str.filters.deceased.dead}</option>
        </Select>

        <Select
          value={filters.onTree === undefined ? 'all' : filters.onTree ? 'yes' : 'no'}
          onChange={(e) => {
            const v = e.target.value
            onChange({ onTree: v === 'all' ? undefined : v === 'yes' })
          }}
          aria-label={str.filters.onTree.label}
          className="md:w-52"
        >
          <option value="all">{str.filters.onTree.all}</option>
          <option value="yes">{str.filters.onTree.yes}</option>
          <option value="no">{str.filters.onTree.no}</option>
        </Select>
      </div>
    </div>
  )
}
