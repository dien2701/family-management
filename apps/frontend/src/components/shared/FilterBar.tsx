import type { ReactNode } from 'react'

type FilterBarProps = {
  /** Ô tìm (đã gồm icon kính lúp nếu có). */
  search: ReactNode
  /** Tên nhóm chip cho trình đọc màn hình. */
  label: string
  /** Các chip lọc và nút xóa lọc; chip nên có `shrink-0` để giữ đủ chữ. */
  children: ReactNode
}

// Thanh lọc trong một thẻ (DESIGN §9): điện thoại là ô tìm rồi hàng chip cuộn ngang trong thẻ (trang không cuộn ngang);
// từ md tất cả một hàng như cũ (hàng chip `md:contents` nên chip nằm thẳng trong hàng của thẻ)
export function FilterBar({ search, label, children }: FilterBarProps) {
  return (
    <div className="min-w-0 rounded-card border border-border bg-surface p-3 shadow-card md:flex md:items-center md:gap-2">
      <div className="relative min-w-0 md:min-w-40 md:flex-1">{search}</div>
      {/* py-1 để viền focus của chip không bị cắt bởi vùng cuộn */}
      <div
        role="group"
        aria-label={label}
        className="-mx-3 mt-2 flex gap-2 overflow-x-auto overscroll-x-contain px-3 py-1 [scrollbar-width:none] md:contents"
      >
        {children}
      </div>
    </div>
  )
}
