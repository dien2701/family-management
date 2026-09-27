// Dựng "tờ" in dưới dạng SVG vector từ kết quả `layoutTree`. Mỗi ô/đường nối là một mục có hộp bao, để khi chia trang
// chỉ đưa vào SVG của trang những mục giao với trang đó. Mọi thuộc tính vẽ đặt thẳng vào phần tử (không dùng class)
// vì svg2pdf và ảnh SVG không đọc được CSS của trang.
import type { TreeMember } from '@/types/api'
import { initialOf } from '@/utils/text'
import { treeStrings } from '../strings'
import { LAYOUT } from '../layout/layoutTree'
import type { LayoutEdge, LayoutResult, PlacedNode } from '../layout/types'
import { yieldToBrowser } from './async'
import { PRINT_FONT, toBase64, type PrintFonts } from './fonts'
import { sheetGeometry, SHEET, type Rect, type SheetGeometry } from './geometry'

const s = treeStrings.print

const CHUNK = 60

const TOKENS = {
  surface: '--color-surface',
  surfaceMuted: '--color-surface-muted',
  border: '--color-border',
  text: '--color-text',
  textMuted: '--color-text-muted',
  deceased: '--color-deceased',
  treeLine: '--color-tree-line',
  secondary: '--color-secondary',
  secondaryFg: '--color-secondary-fg',
  warning: '--color-warning',
  warningBg: '--color-warning-bg',
} as const

export type PrintColors = Record<keyof typeof TOKENS, string>

/** Màu lấy từ token của giao diện (DESIGN §1), không viết mã màu trong code. */
export function readPrintColors(): PrintColors {
  const style = getComputedStyle(document.documentElement)
  const read = (name: string) => style.getPropertyValue(name).trim() || 'black'
  return Object.fromEntries(Object.entries(TOKENS).map(([key, name]) => [key, read(name)])) as PrintColors
}

type SceneItem = { x0: number; y0: number; x1: number; y1: number; svg: string }

export type Scene = {
  sheet: SheetGeometry
  colors: PrintColors
  items: SceneItem[]
  generations: { label: string; cy: number; labelWidth: number }[]
}

export type SceneInput = {
  layout: LayoutResult
  colors: PrintColors
  /** URL ảnh gốc → ảnh đã xử lý; bỏ trống thì không in ảnh đại diện. */
  photos: Map<string, string> | null
  title: string
  subtitle: string
  signal: AbortSignal
  onProgress: (percent: number) => void
}

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const num = (value: number) => Number(value.toFixed(2))

let measureContext: CanvasRenderingContext2D | null = null

/** Độ rộng chữ theo đúng font in (đã đăng ký ở `loadPrintFonts`). */
function measure(text: string, size: number, bold: boolean): number {
  measureContext ??= document.createElement('canvas').getContext('2d')
  if (!measureContext) return text.length * size * 0.55
  measureContext.font = `${bold ? 700 : 400} ${size}px ${PRINT_FONT}`
  return measureContext.measureText(text).width
}

/** Cắt bớt chữ có dấu "…" cho vừa độ rộng. */
function fit(text: string, maxWidth: number, size: number, bold: boolean): string {
  if (measure(text, size, bold) <= maxWidth) return text
  let end = text.length
  while (end > 1 && measure(`${text.slice(0, end).trimEnd()}…`, size, bold) > maxWidth) end -= 1
  return `${text.slice(0, end).trimEnd()}…`
}

/** Ngắt tối đa 2 dòng theo từ; dòng cuối dài quá thì cắt bằng "…". */
function wrapName(name: string, maxWidth: number, size: number): string[] {
  if (measure(name, size, true) <= maxWidth) return [name]
  const words = name.split(/\s+/)
  let first = ''
  let used = 0
  for (const word of words) {
    const next = first ? `${first} ${word}` : word
    if (first && measure(next, size, true) > maxWidth) break
    first = next
    used += 1
  }
  const rest = words.slice(used).join(' ')
  return rest ? [fit(first, maxWidth, size, true), fit(rest, maxWidth, size, true)] : [fit(first, maxWidth, size, true)]
}

type Attrs = Record<string, string | number | undefined>

const attrs = (values: Attrs) =>
  Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => ` ${key}="${typeof value === 'number' ? num(value) : escapeXml(value as string)}"`)
    .join('')

function textEl(
  x: number,
  y: number,
  content: string,
  size: number,
  bold: boolean,
  fill: string,
  anchor?: 'middle' | 'end',
): string {
  return `<text${attrs({
    x,
    y,
    'font-family': PRINT_FONT,
    'font-size': size,
    'font-weight': bold ? 'bold' : 'normal',
    fill,
    'text-anchor': anchor,
  })}>${escapeXml(content)}</text>`
}

const CROSS_W = 9

/** Năm sinh – năm mất; dấu ✝ vẽ bằng nét vì font không có ký tự này. */
function yearsSvg(member: TreeMember, x: number, baseline: number, colors: PrintColors): string {
  if (!member.isDeceased) {
    return member.birthYear === null ? '' : textEl(x, baseline, String(member.birthYear), 14, false, colors.textMuted)
  }
  let out = ''
  let cursor = x
  if (member.birthYear !== null) {
    const prefix = `${member.birthYear} – `
    out += textEl(cursor, baseline, prefix, 14, false, colors.textMuted)
    cursor += measure(prefix, 14, false)
  }
  const cx = cursor + CROSS_W / 2
  out += `<path${attrs({
    d: `M${num(cx)} ${num(baseline - 12)}V${num(baseline)}M${num(cursor + 1)} ${num(baseline - 8)}H${num(cursor + CROSS_W - 1)}`,
    fill: 'none',
    stroke: colors.textMuted,
    'stroke-width': 1.6,
  })}/>`
  out += textEl(cursor + CROSS_W + 3, baseline, String(member.deathYear ?? '?'), 14, false, colors.textMuted)
  return out
}

const AVATAR = 40
const AVATAR_PAD = 8

function nodeSvg(placed: PlacedNode, ox: number, oy: number, input: SceneInput): string {
  const { colors, photos } = input
  const { width: W, height: H } = placed
  const x = ox + placed.x
  const y = oy + placed.y
  const member = placed.node.member
  const empty = member === null

  let out = `<rect${attrs({
    x,
    y,
    width: W,
    height: H,
    rx: 12,
    fill: empty ? colors.surfaceMuted : colors.surface,
    stroke: empty || member.isDeceased ? colors.deceased : colors.border,
    'stroke-width': 2,
    'stroke-dasharray': empty ? '6 4' : undefined,
  })}/>`

  if (empty) return out + textEl(x + W / 2, y + H / 2 + 5, treeStrings.emptySlot, 16, false, colors.textMuted, 'middle')

  const withPhotos = photos !== null
  const textX = withPhotos ? x + AVATAR_PAD + AVATAR + 8 : x + 12
  const textWidth = x + W - 8 - textX
  if (withPhotos) {
    const cx = x + AVATAR_PAD + AVATAR / 2
    const cy = y + H / 2
    const photo = member.avatarUrl ? photos.get(member.avatarUrl) : undefined
    if (photo) {
      out += `<image${attrs({ x: cx - AVATAR / 2, y: cy - AVATAR / 2, width: AVATAR, height: AVATAR, href: photo, 'xlink:href': photo })}/>`
    } else {
      out += `<circle${attrs({ cx, cy, r: AVATAR / 2, fill: colors.secondary })}/>`
      out += textEl(cx, cy + 6, initialOf(member.fullName), 16, true, colors.secondaryFg, 'middle')
    }
  }

  const lines = wrapName(member.fullName, textWidth, 16)
  const hasYears = member.isDeceased || member.birthYear !== null
  const block = lines.length * 19 + (hasYears ? 18 : 0)
  const top = y + (H - block) / 2
  lines.forEach((line, i) => {
    out += textEl(textX, top + 15 + i * 19, line, 16, true, colors.text)
  })
  if (hasYears) out += yearsSvg(member, textX, top + lines.length * 19 + 14, colors)

  // Nhãn đặc biệt đè lên viền trên của ô
  const firstLabel = member.labels[0]
  if (firstLabel) {
    const extra = member.labels.length - 1
    const label = fit(extra > 0 ? `${firstLabel} +${extra}` : firstLabel, 124, 13, true)
    const w = measure(label, 13, true) + 16
    const px = x + W - 12 - w
    out += `<rect${attrs({ x: px, y: y - 9, width: w, height: 18, rx: 9, fill: colors.warningBg })}/>`
    out += textEl(px + w / 2, y + 4, label, 13, true, colors.warning, 'middle')
  }
  return out
}

function edgeSvg(edge: LayoutEdge, ox: number, oy: number, colors: PrintColors, showOrder: boolean) {
  let out = `<polyline${attrs({
    points: edge.points.map((p) => `${num(ox + p.x)},${num(oy + p.y)}`).join(' '),
    fill: 'none',
    stroke: colors.treeLine,
    // Nét dày hơn màn hình một chút để còn rõ khi in nhỏ
    'stroke-width': 2,
    'stroke-linejoin': 'round',
  })}/>`
  if (showOrder && edge.anchor && edge.order !== null) {
    const cx = ox + edge.anchor.x
    const cy = oy + edge.anchor.y
    out += `<circle${attrs({ cx, cy, r: 11, fill: colors.surface, stroke: colors.treeLine, 'stroke-width': 1.5 })}/>`
    out += textEl(cx, cy + 4.5, String(edge.order), 12, true, colors.textMuted, 'middle')
  }
  return out
}

export async function buildScene(input: SceneInput): Promise<Scene> {
  const { layout, colors, signal } = input
  const sheet = sheetGeometry(layout)
  const { originX: ox, originY: oy } = sheet
  const items: SceneItem[] = []
  const H = LAYOUT.nodeHeight

  const rowGuides: SceneItem[] = layout.generations.map((g) => {
    const y = oy + g.y + H / 2
    const x0 = SHEET.margin + SHEET.gutter - 8
    const x1 = sheet.width - SHEET.margin
    return {
      x0,
      y0: y - 1,
      x1,
      y1: y + 1,
      svg: `<line${attrs({ x1: x0, y1: y, x2: x1, y2: y, stroke: colors.border, 'stroke-width': 1, 'stroke-dasharray': '2 6' })}/>`,
    }
  })
  items.push(...rowGuides)

  const gutterX = ox - 20
  items.push({
    x0: gutterX - 1,
    y0: oy - 10,
    x1: gutterX + 1,
    y1: oy + layout.height + 10,
    svg: `<line${attrs({ x1: gutterX, y1: oy - 10, x2: gutterX, y2: oy + layout.height + 10, stroke: colors.border, 'stroke-width': 1 })}/>`,
  })

  const titleWidth = Math.max(measure(input.title, 32, true), measure(input.subtitle, 16, false))
  items.push({
    x0: SHEET.margin,
    y0: SHEET.margin,
    x1: SHEET.margin + titleWidth,
    y1: SHEET.margin + 68,
    svg:
      textEl(SHEET.margin, SHEET.margin + 30, input.title, 32, true, colors.text) +
      textEl(SHEET.margin, SHEET.margin + 58, input.subtitle, 16, false, colors.textMuted),
  })

  // Vòng tròn số thứ tự chỉ có ý nghĩa khi người đó có từ 2 vợ/chồng
  const spouseCount = new Map<number, number>()
  for (const edge of layout.edges) {
    if (edge.kind === 'marriage') spouseCount.set(edge.fromNodeId, (spouseCount.get(edge.fromNodeId) ?? 0) + 1)
  }

  const total = layout.edges.length + layout.nodes.length
  let done = 0
  const tick = async () => {
    done += 1
    if (done % CHUNK === 0) {
      input.onProgress(Math.min(99, Math.round((done / total) * 100)))
      await yieldToBrowser(signal)
    }
  }

  for (const edge of layout.edges) {
    const xs = edge.points.map((p) => ox + p.x)
    const ys = edge.points.map((p) => oy + p.y)
    items.push({
      x0: Math.min(...xs) - 12,
      y0: Math.min(...ys) - 12,
      x1: Math.max(...xs) + 12,
      y1: Math.max(...ys) + 12,
      svg: edgeSvg(edge, ox, oy, colors, (spouseCount.get(edge.fromNodeId) ?? 0) > 1),
    })
    await tick()
  }

  for (const placed of layout.nodes) {
    items.push({
      x0: ox + placed.x - 2,
      y0: oy + placed.y - 12,
      x1: ox + placed.x + placed.width + 2,
      y1: oy + placed.y + placed.height + 2,
      svg: nodeSvg(placed, ox, oy, input),
    })
    await tick()
  }

  input.onProgress(100)
  return {
    sheet,
    colors,
    items,
    generations: layout.generations.map((g) => {
      const label = s.generationLabel(g.generation)
      return { label, cy: oy + g.y + H / 2, labelWidth: measure(label, 14, true) }
    }),
  }
}

export type RenderOptions = {
  /** Nhúng font vào SVG (chỉ cần cho ảnh PNG; PDF nhúng font qua jsPDF). */
  fonts?: PrintFonts
  /** Cắt phần vẽ tràn ra ngoài trang (khi chia trang). */
  clip?: boolean
}

const intersects = (item: SceneItem, r: Rect) =>
  item.x1 >= r.x && item.x0 <= r.x + r.w && item.y1 >= r.y && item.y0 <= r.y + r.h

/** SVG của một vùng (`view`, tính bằng unit) của tờ, hiển thị ở kích thước `width`×`height`. */
export function renderSvg(
  scene: Scene,
  view: Rect,
  size: { width: number; height: number },
  options: RenderOptions = {},
): string {
  const { colors } = scene
  const body = scene.items.filter((item) => intersects(item, view)).map((item) => item.svg)

  // Nhãn "Đời" của mỗi hàng: ở cột trang đầu nằm trong lề trái, các cột sau lặp lại ở mép trang cho dễ ghép
  const labelX = view.x <= 0 ? SHEET.margin : view.x + 6
  for (const g of scene.generations) {
    if (g.cy < view.y - 16 || g.cy > view.y + view.h + 16) continue
    const w = g.labelWidth + 20
    body.push(
      `<rect${attrs({ x: labelX, y: g.cy - 13, width: w, height: 26, rx: 13, fill: colors.surfaceMuted })}/>`,
      textEl(labelX + 10, g.cy + 5, g.label, 14, true, colors.textMuted),
    )
  }

  const fontFaces = options.fonts
    ? `<defs><style>${[
        [options.fonts.regular, 400],
        [options.fonts.bold, 700],
      ]
        .map(
          ([buffer, weight]) =>
            `@font-face{font-family:${PRINT_FONT};font-weight:${weight};src:url(data:font/ttf;base64,${toBase64(buffer as ArrayBuffer)}) format('truetype');}`,
        )
        .join('')}</style></defs>`
    : ''
  const clipId = 'print-clip'
  const clip = options.clip
    ? `<defs><clipPath id="${clipId}"><rect${attrs({ x: view.x, y: view.y, width: view.w, height: view.h })}/></clipPath></defs>`
    : ''

  return (
    `<svg${attrs({
      xmlns: 'http://www.w3.org/2000/svg',
      'xmlns:xlink': 'http://www.w3.org/1999/xlink',
      width: size.width,
      height: size.height,
      viewBox: `${num(view.x)} ${num(view.y)} ${num(view.w)} ${num(view.h)}`,
    })}>` +
    fontFaces +
    clip +
    `<rect${attrs({ x: view.x, y: view.y, width: view.w, height: view.h, fill: colors.surface })}/>` +
    `<g${options.clip ? ` clip-path="url(#${clipId})"` : ''}>${body.join('')}</g></svg>`
  )
}
