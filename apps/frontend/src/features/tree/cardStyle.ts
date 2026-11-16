// Tông màu và hình dạng ô cây (DECISIONS #100, DESIGN §1). Một nguồn duy nhất cho cả sơ đồ trên màn hình
// (lớp Tailwind) lẫn bản in SVG (tên biến CSS), để hai bên không bao giờ lệch nhau.
import type { TreeNode } from '@/types/api'

/** Tông của một ô: theo giới tính, nhưng người đã mất luôn là `gone` (như bản mẫu). */
export type CardTone = 'male' | 'female' | 'unknown' | 'gone' | 'empty'

export function cardTone(node: TreeNode): CardTone {
  const member = node.member
  if (!member) return 'empty'
  if (member.isDeceased) return 'gone'
  if (member.gender === 'M') return 'male'
  if (member.gender === 'F') return 'female'
  return 'unknown'
}

/** Viền + nền của ô trên màn hình. Ô trống giữ viền đứt như trước. */
export const TONE_CLASS: Record<CardTone, string> = {
  male: 'border-tree-male bg-tree-male-bg',
  female: 'border-tree-female bg-tree-female-bg',
  unknown: 'border-tree-unknown bg-tree-unknown-bg',
  gone: 'border-tree-gone bg-tree-gone-bg',
  empty: 'border-dashed border-tree-gone bg-surface-muted',
}

/** Nền vòng tròn ảnh đại diện (chữ cái đầu): cùng tông với ô nhưng đậm hơn một mức. */
export const TONE_AVATAR_CLASS: Record<CardTone, string> = {
  male: 'bg-tree-male/25 text-text',
  female: 'bg-tree-female/25 text-text',
  unknown: 'bg-secondary text-secondary-fg',
  gone: 'bg-tree-gone/25 text-text-muted',
  empty: 'bg-surface-muted text-text-muted',
}

/** Tên biến CSS của từng tông, cho bản in đọc ra mã màu thật (print/scene.ts). */
export const TONE_VARS: Record<CardTone, { border: string; bg: string }> = {
  male: { border: '--color-tree-male', bg: '--color-tree-male-bg' },
  female: { border: '--color-tree-female', bg: '--color-tree-female-bg' },
  unknown: { border: '--color-tree-unknown', bg: '--color-tree-unknown-bg' },
  gone: { border: '--color-tree-gone', bg: '--color-tree-gone-bg' },
  empty: { border: '--color-tree-gone', bg: '--color-surface-muted' },
}

export type TreePalette = 'classic' | 'neutral' | 'warm' | 'forest' | 'royal'
export const PALETTES: readonly TreePalette[] = ['classic', 'neutral', 'warm', 'forest', 'royal']

export type TreeShape = 'square' | 'soft' | 'rounded' | 'pill'
export const SHAPES: readonly TreeShape[] = ['square', 'soft', 'rounded', 'pill']

export const SHAPE_CLASS: Record<TreeShape, string> = {
  square: 'rounded-none',
  soft: 'rounded-md',
  rounded: 'rounded-field',
  pill: 'rounded-[28px]',
}

/** Bán kính bo góc tính bằng pixel, cho bản in SVG (`rx` của `<rect>`). */
export const SHAPE_RADIUS: Record<TreeShape, number> = { square: 0, soft: 6, rounded: 12, pill: 28 }

/** Lọc người hiện trên cây. `male` giữ người chưa điền giới tính (nếu không cây gần như trống). */
export type TreeFilter = 'all' | 'male' | 'bloodline'
export const FILTERS: readonly TreeFilter[] = ['all', 'male', 'bloodline']

/** Các thông tin bật/tắt được trên ô. Nhãn đặc biệt đè lên viền nên không ảnh hưởng cỡ ô. */
export type TreeCardFields = { photo: boolean; labels: boolean; years: boolean }
export const DEFAULT_CARD: TreeCardFields = { photo: true, labels: true, years: true }
