import { useEffect, useState } from 'react'

const secondsUntil = (targetMs: number) => Math.max(0, Math.ceil((targetMs - Date.now()) / 1000))

/** Số giây còn lại tới `targetMs`. Đổi mốc thì gắn `key` mới cho component dùng hook để khởi tạo lại. */
export function useCountdown(targetMs: number): number {
  const [remaining, setRemaining] = useState(() => secondsUntil(targetMs))

  useEffect(() => {
    if (secondsUntil(targetMs) === 0) return
    const id = setInterval(() => {
      const next = secondsUntil(targetMs)
      setRemaining(next)
      if (next === 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [targetMs])

  return remaining
}
