import { useCallback, useMemo, useState } from 'react'
import type { NodeOverride, TreeSize, TreeViewPrefs } from './nodeSize'

const KEY = 'tocpha.tree.view'
const SIZES: readonly TreeSize[] = ['small', 'medium', 'large']

type Stored = TreeViewPrefs & { nodes: Record<string, NodeOverride> }
const DEFAULT: Stored = { vertical: false, size: 'medium', nodes: {} }

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)

function read(): Stored {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULT
    const parsed = JSON.parse(raw) as Partial<Stored>
    const nodes: Record<string, NodeOverride> = {}
    for (const [id, o] of Object.entries(parsed.nodes ?? {})) {
      if (typeof o !== 'object' || o === null) continue
      nodes[id] = {
        ...(typeof o.vertical === 'boolean' ? { vertical: o.vertical } : {}),
        ...(num(o.width) !== undefined ? { width: num(o.width) } : {}),
        ...(num(o.height) !== undefined ? { height: num(o.height) } : {}),
      }
    }
    return {
      vertical: parsed.vertical === true,
      size: SIZES.includes(parsed.size as TreeSize) ? (parsed.size as TreeSize) : DEFAULT.size,
      nodes,
    }
  } catch {
    return DEFAULT
  }
}

/**
 * Cách hiển thị cây, nhớ trong trình duyệt (tiện ích của từng người xem, không lên máy chủ):
 * dọc/ngang và cỡ chung cho cả cây, cùng tùy chỉnh riêng từng ô (kiểu dọc/ngang, cỡ kéo tay).
 */
export function useTreeViewPrefs() {
  const [stored, setStored] = useState<Stored>(read)

  const commit = useCallback((change: (current: Stored) => Stored) => {
    setStored((current) => {
      const next = change(current)
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        // Không lưu được (chế độ riêng tư...) thì vẫn dùng trong phiên này
      }
      return next
    })
  }, [])

  /** Đổi kiểu chung: các ô đã chỉnh riêng kiểu dọc/ngang giữ nguyên lựa chọn của chúng. */
  const setPrefs = useCallback(
    (change: Partial<TreeViewPrefs>) => commit((c) => ({ ...c, ...change })),
    [commit],
  )

  /** Gộp `patch` vào tùy chỉnh của một ô; `null` là bỏ tùy chỉnh của ô đó. */
  const setNode = useCallback(
    (nodeId: number, patch: NodeOverride | null) =>
      commit((c) => {
        const nodes = { ...c.nodes }
        if (patch === null) delete nodes[nodeId]
        else nodes[nodeId] = { ...nodes[nodeId], ...patch }
        return { ...c, nodes }
      }),
    [commit],
  )

  const resetNodes = useCallback(() => commit((c) => ({ ...c, nodes: {} })), [commit])

  const prefs = useMemo<TreeViewPrefs>(() => ({ vertical: stored.vertical, size: stored.size }), [stored.vertical, stored.size])
  return { prefs, nodes: stored.nodes, setPrefs, setNode, resetNodes }
}
