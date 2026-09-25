import { useEffect, useState } from 'react'

/** Giá trị trễ `delayMs` sau lần đổi cuối, để ô tìm kiếm không gọi API ở từng phím gõ. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}
