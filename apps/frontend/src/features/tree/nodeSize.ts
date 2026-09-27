// Cỡ ô trên cây: vừa với tên dài nhất (mọi ô cùng cỡ để layout không đổi theo từng ô) và cỡ chung Nhỏ/Vừa/Lớn.
// Đo bằng canvas với đúng font của app; nếu chưa đo được thì dùng ước lượng theo số ký tự.
import type { TreeNode } from '@/types/api'
import { nodeName, yearsLines, yearsText } from './nodeText'

export type TreeSize = 'small' | 'medium' | 'large'
export type TreeViewPrefs = { vertical: boolean; size: TreeSize }

/** Tùy chỉnh riêng một ô (chỉ lưu trên máy này): kiểu dọc/ngang và cỡ kéo tay. */
export type NodeOverride = { vertical?: boolean; width?: number; height?: number }

export const SIZE_SCALE: Record<TreeSize, number> = { small: 0.85, medium: 1, large: 1.25 }

const NAME_FONT = '600 16px'
const YEARS_FONT = '400 14px'
const FALLBACK_FAMILY = "'Be Vietnam Pro', system-ui, sans-serif"

// Kích thước phần cố định của ô (theo pixel ở cỡ Vừa)
const HORIZONTAL = { chrome: 68, minWidth: 160, minHeight: 72, lineHeight: 20, verticalPadding: 18 }
// Ô dọc (như ảnh mẫu): mỗi từ một dòng, không ảnh đại diện, năm ở cuối
const VERTICAL = { chrome: 20, minWidth: 72, lineHeight: 20, yearsLineHeight: 18, verticalPadding: 20, minHeight: 120 }
const SLACK = 6

let context: CanvasRenderingContext2D | null | undefined

function measurer(): ((text: string, font: string) => number) | null {
  if (context === undefined) {
    try {
      context = document.createElement('canvas').getContext('2d')
    } catch {
      context = null
    }
  }
  const ctx = context
  if (!ctx) return null
  return (text, font) => {
    ctx.font = `${font} ${FALLBACK_FAMILY}`
    return ctx.measureText(text).width
  }
}

function widthOf(text: string, font: string): number {
  const measure = measurer()
  // Ước lượng khi không đo được (môi trường không có canvas)
  return measure ? measure(text, font) : text.length * (font === NAME_FONT ? 9.5 : 8)
}

/** Số dòng khi xuống dòng theo từ trong cột rộng `col`. */
function linesFor(words: string[], col: number): number {
  let lines = 1
  let current = 0
  const space = widthOf(' ', NAME_FONT)
  for (const word of words) {
    const w = widthOf(word, NAME_FONT)
    if (current === 0) current = w
    else if (current + space + w <= col) current += space + w
    else {
      lines += 1
      current = w
    }
  }
  return lines
}

/** Cột chữ hẹp nhất để tên xuống dòng không quá 2 dòng. */
function narrowestColumn(name: string): number {
  const words = name.split(/\s+/).filter(Boolean)
  const full = widthOf(name, NAME_FONT)
  const longestWord = words.reduce((max, w) => Math.max(max, widthOf(w, NAME_FONT)), 0)
  let col = Math.ceil(longestWord)
  while (col < full && linesFor(words, col) > 2) col += 4
  return Math.ceil(Math.min(col, full))
}

export type NodeSize = { width: number; height: number }
export type NodeSizes = { horizontal: NodeSize; vertical: NodeSize }

/** Cỡ ô cho cả cây ở hai kiểu hiển thị: vừa với tên (và năm) dài nhất, rồi nhân với cỡ chung. */
export function fitNodeSizes(nodes: Iterable<TreeNode>, size: TreeSize): NodeSizes {
  const scale = SIZE_SCALE[size]
  let column = 0
  let yearsWidth = 0
  let yearLinesWidth = 0
  let longestWord = 0
  let maxWords = 1
  let maxYearLines = 1
  const fulls: number[] = []
  for (const node of nodes) {
    if (!node.member) continue
    const name = nodeName(node)
    const words = name.split(/\s+/).filter(Boolean)
    fulls.push(widthOf(name, NAME_FONT))
    maxWords = Math.max(maxWords, words.length)
    for (const word of words) longestWord = Math.max(longestWord, widthOf(word, NAME_FONT))
    yearsWidth = Math.max(yearsWidth, widthOf(yearsText(node.member), YEARS_FONT))
    column = Math.max(column, narrowestColumn(name))
    const yearLines = yearsLines(node.member)
    maxYearLines = Math.max(maxYearLines, yearLines.length)
    for (const line of yearLines) yearLinesWidth = Math.max(yearLinesWidth, widthOf(line, YEARS_FONT))
  }
  const scaled = (n: NodeSize): NodeSize => ({ width: Math.ceil(n.width * scale), height: Math.ceil(n.height * scale) })

  // Có tên phải xuống dòng (dài hơn cột chung) thì chừa chỗ cho 2 dòng
  const lines = fulls.some((full) => full > column) ? 2 : 1
  const horizontal = {
    width: Math.max(HORIZONTAL.minWidth, HORIZONTAL.chrome + Math.max(column, yearsWidth) + SLACK),
    height: Math.max(HORIZONTAL.minHeight, HORIZONTAL.lineHeight * (lines + 1) + HORIZONTAL.verticalPadding),
  }
  const vertical = {
    width: Math.max(VERTICAL.minWidth, VERTICAL.chrome + Math.max(longestWord, yearLinesWidth) + SLACK),
    height: Math.max(
      VERTICAL.minHeight,
      VERTICAL.verticalPadding + maxWords * VERTICAL.lineHeight + maxYearLines * VERTICAL.yearsLineHeight + 6,
    ),
  }
  return { horizontal: scaled(horizontal), vertical: scaled(vertical) }
}
