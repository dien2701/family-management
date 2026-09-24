import { useEffect } from 'react'
import { useMatches } from 'react-router'
import type { RouteHandle } from '@/types/route'

const APP_NAME = 'Gia Phả'

/** Lấy tiêu đề từ `handle` của route sâu nhất và cập nhật `document.title`. */
export function useRouteTitle(): string {
  const matches = useMatches()
  const title =
    [...matches]
      .reverse()
      .map((m) => (m.handle as RouteHandle | undefined)?.title)
      .find(Boolean) ?? APP_NAME

  useEffect(() => {
    document.title = title === APP_NAME ? APP_NAME : `${title} · ${APP_NAME}`
  }, [title])

  return title
}
