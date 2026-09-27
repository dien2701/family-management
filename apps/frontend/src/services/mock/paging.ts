export type PageResult<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

/** Cắt một trang từ danh sách đã lọc và sắp xếp (page bắt đầu từ 0, giống backend). */
export function paginate<T>(all: readonly T[], page: number, size: number): PageResult<T> {
  return {
    items: all.slice(page * size, page * size + size),
    page,
    size,
    totalElements: all.length,
    totalPages: Math.ceil(all.length / size),
  }
}
