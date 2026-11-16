// Cỡ ô trên cây: vừa với tên dài nhất (mọi ô cùng cỡ để layout không đổi theo từng ô) và cỡ chung Nhỏ/Vừa/Lớn.
// Đo bằng canvas với đúng font của app; nếu chưa đo được thì dùng ước lượng theo số ký tự.
import type { TreeNode } from '@/types/api'
import type { TreeCardFields, TreeFilter, TreePalette, TreeShape } from './cardStyle'
import { nodeName, yearsText } from './nodeText'

export type TreeSize = 'small' | 'medium' | 'large'

/** Cách hiển thị chung cho cả cây, lưu trên máy người xem (DECISIONS #100). */
export type TreeViewPrefs = {
  vertical: boolean
  size: TreeSize
  palette: TreePalette
  shape: TreeShape
  filter: TreeFilter
  card: TreeCardFields
}

/** Tùy chỉnh riêng một ô (chỉ lưu trên máy này): kiểu dọc/ngang và cỡ kéo tay. */
export type NodeOverride = { vertical?: boolean; width?: number; height?: number }

export const SIZE_SCALE: Record<TreeSize, number> = { small: 0.85, medium: 1, large: 1.25 }

const NAME_FONT = '600 16px'
const YEARS_FONT = '400 14px'
// Ô dọc là nhãn sơ đồ, nhỏ hơn một bậc (DESIGN §6, ngoại lệ cỡ chữ)
const V_NAME_FONT = '600 15px'
const V_YEARS_FONT = '400 13px'
const FALLBACK_FAMILY = "'Be Vietnam Pro', system-ui, sans-serif"

// Kích thước phần cố định của ô (theo pixel ở cỡ Vừa)
const HORIZONTAL = { chrome: 68, minWidth: 160, minHeight: 72, lineHeight: 20, verticalPadding: 18 }
// Ô dọc kiểu mẫu (#102): ảnh tròn 44px trên cùng, tên ở giữa (mỗi dòng rộng cỡ "Bà Nguyễn", không giới hạn số dòng),
// năm sinh–mất sát đáy
const VERTICAL = {
  chrome: 16,
  minWidth: 72,
  minHeight: 96,
  nameLine: 20,
  yearsLine: 18,
  photo: 44,
  photoGap: 6,
  padding: 22,
  /** Mẫu bề rộng một dòng tên: đủ hai chữ ngắn. */
  sampleLine: 'Bà Nguyễn',
  /** Luôn chừa chỗ cho ít nhất 3 dòng tên để mọi ô cao đều (kiểu "Bà / Nguyễn Thị / Khương"). */
  minNameLines: 3,
}
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
  return measure ? measure(text, font) : text.length * (font.startsWith('600') ? 9.5 : 8)
}

/** Số dòng khi xuống dòng theo từ trong cột rộng `col`. */
function linesFor(words: string[], col: number, font: string): number {
  let lines = 1
  let current = 0
  const space = widthOf(' ', font)
  for (const word of words) {
    const w = widthOf(word, font)
    if (current === 0) current = w
    else if (current + space + w <= col) current += space + w
    else {
      lines += 1
      current = w
    }
  }
  return lines
}

const wordsOf = (name: string) => name.split(/\s+/).filter(Boolean)

/** Cột chữ hẹp nhất để tên xuống dòng không quá 2 dòng. */
function narrowestColumn(name: string, font: string): number {
  const words = wordsOf(name)
  const full = widthOf(name, font)
  const longestWord = words.reduce((max, w) => Math.max(max, widthOf(w, font)), 0)
  let col = Math.ceil(longestWord)
  while (col < full && linesFor(words, col, font) > 2) col += 4
  return Math.ceil(Math.min(col, full))
}

export type NodeSize = { width: number; height: number }
export type NodeSizes = { horizontal: NodeSize; vertical: NodeSize }

/**
 * Cỡ ô cho cả cây ở hai kiểu hiển thị: vừa với tên (và năm) dài nhất, rồi nhân với cỡ chung.
 * `card` là các thông tin đang bật: tắt ảnh hoặc năm thì ô thấp lại và cây xếp gọn hơn.
 */
export function fitNodeSizes(nodes: Iterable<TreeNode>, size: TreeSize, card: TreeCardFields): NodeSizes {
  const scale = SIZE_SCALE[size]
  let column = 0
  let yearsWidth = 0
  // Cột cố định cỡ "Bà Nguyễn"; chỉ nới ra khi có một chữ đơn (hoặc dòng năm) rộng hơn
  let vColumn = Math.ceil(widthOf(VERTICAL.sampleLine, V_NAME_FONT))
  let vYearsWidth = 0
  const fulls: number[] = []
  const names: string[] = []
  for (const node of nodes) {
    if (!node.member) continue
    const name = nodeName(node)
    const years = yearsText(node.member)
    fulls.push(widthOf(name, NAME_FONT))
    names.push(name)
    column = Math.max(column, narrowestColumn(name, NAME_FONT))
    for (const word of wordsOf(name)) vColumn = Math.max(vColumn, Math.ceil(widthOf(word, V_NAME_FONT)))
    yearsWidth = Math.max(yearsWidth, widthOf(years, YEARS_FONT))
    vYearsWidth = Math.max(vYearsWidth, widthOf(years, V_YEARS_FONT))
  }
  const scaled = (n: NodeSize): NodeSize => ({ width: Math.ceil(n.width * scale), height: Math.ceil(n.height * scale) })

  // Có tên phải xuống dòng (dài hơn cột chung) thì chừa chỗ cho 2 dòng
  const lines = fulls.some((full) => full > column) ? 2 : 1
  const horizontal = {
    width: Math.max(HORIZONTAL.minWidth, HORIZONTAL.chrome + Math.max(column, yearsWidth) + SLACK),
    height: Math.max(HORIZONTAL.minHeight, HORIZONTAL.lineHeight * (lines + 1) + HORIZONTAL.verticalPadding),
  }

  // Số dòng thật của tên nhiều dòng nhất trong cột chung (không giới hạn) để mọi ô hiện đủ tên
  // (tính trên cột thật: dòng năm rộng hơn thì tên cũng được dàn rộng theo, như trình duyệt)
  const vText = Math.max(vColumn, card.years ? vYearsWidth : 0)
  const vLines = names.reduce((max, name) => Math.max(max, linesFor(wordsOf(name), vText + SLACK, V_NAME_FONT)), VERTICAL.minNameLines)
  const vertical = {
    width: Math.max(VERTICAL.minWidth, VERTICAL.chrome + vText + SLACK),
    height: Math.max(
      VERTICAL.minHeight,
      VERTICAL.padding +
        (card.photo ? VERTICAL.photo + VERTICAL.photoGap : 0) +
        vLines * VERTICAL.nameLine +
        (card.years ? VERTICAL.yearsLine : 0),
    ),
  }
  return { horizontal: scaled(horizontal), vertical: scaled(vertical) }
}
