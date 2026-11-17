// Dựng "tờ" in dưới dạng SVG vector từ kết quả `layoutTree`. Mỗi ô/đường nối là một mục có hộp bao, để khi chia trang
// chỉ đưa vào SVG của trang những mục giao với trang đó. Mọi thuộc tính vẽ đặt thẳng vào phần tử (không dùng class)
// vì svg2pdf và ảnh SVG không đọc được CSS của trang.
import type { TreeMember } from '@/types/api'
import { initialOf } from '@/utils/text'
import { cardTone, SHAPE_RADIUS, TONE_VARS, type CardLook, type CardTone, type TreePalette } from '../cardStyle'
import { yearsText } from '../nodeText'
import { treeStrings } from '../strings'
import type { LayoutEdge, LayoutResult, PlacedNode } from '../layout/types'
import { yieldToBrowser } from './async'
import { grayKey } from './photos'
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
  marriage: '--color-tree-marriage',
} as const

const TONES: readonly CardTone[] = ['male', 'female', 'unknown', 'gone', 'empty']

export type PrintColors = Record<keyof typeof TOKENS, string> & {
  /** Viền / nền ô theo tông, đã tính theo bảng màu đang chọn. */
  tones: Record<CardTone, { border: string; bg: string }>
}

/**
 * Màu lấy từ token của giao diện (DESIGN §1), không viết mã màu trong code. Đọc trên một phần tử tạm có
 * `data-tree-palette` để ra đúng màu Nam/Nữ của bảng đang chọn (#100).
 */
export function readPrintColors(palette: TreePalette): PrintColors {
  const probe = document.createElement('div')
  probe.dataset.treePalette = palette
  // Bản in luôn nền giấy sáng, kể cả khi đang ở giao diện tối (ô cây sáng, index.css)
  probe.className = 'tree-light'
  probe.hidden = true
  document.body.append(probe)
  try {
    const style = getComputedStyle(probe)
    const read = (name: string) => style.getPropertyValue(name).trim() || 'black'
    const base = Object.fromEntries(Object.entries(TOKENS).map(([key, name]) => [key, read(name)]))
    const tones = Object.fromEntries(
      TONES.map((tone) => [tone, { border: read(TONE_VARS[tone].border), bg: read(TONE_VARS[tone].bg) }]),
    )
    return { ...base, tones } as PrintColors
  } finally {
    probe.remove()
  }
}

/** `tree`: ô hoặc đường nối, dời theo `shiftX` khi vẽ; còn lại (tiêu đề, đường kẻ cột "Đời") đứng yên. */
type SceneItem = { x0: number; y0: number; x1: number; y1: number; svg: string; tree?: boolean }

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
  /** Ô nào hiển thị dọc (mỗi từ của tên một dòng) như trên màn hình. */
  verticalOf: (nodeId: number) => boolean
  /** Hình dạng và thông tin trên ô như hộp Cấu hình cây (bảng màu đã nằm trong `colors`). */
  look: CardLook
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

/** Ngắt tối đa `maxLines` dòng theo từ; dòng cuối dài quá thì cắt bằng "…". */
function wrapName(name: string, maxWidth: number, size: number, maxLines = 2): string[] {
  const lines: string[] = []
  let words = name.split(/\s+/).filter(Boolean)
  while (words.length > 0 && lines.length < maxLines - 1) {
    let line = words[0]!
    let used = 1
    while (used < words.length && measure(`${line} ${words[used]}`, size, true) <= maxWidth) line += ` ${words[used++]}`
    lines.push(fit(line, maxWidth, size, true))
    words = words.slice(used)
  }
  if (words.length > 0) lines.push(fit(words.join(' '), maxWidth, size, true))
  return lines
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

/** Năm sinh – năm mất như trên màn hình. `center` thì `x` là tâm dòng (ô dọc), không thì là mép trái (ô ngang). */
function yearsSvg(member: TreeMember, x: number, baseline: number, size: number, colors: PrintColors, center = false): string {
  const text = yearsText(member)
  return text ? textEl(x, baseline, text, size, false, colors.textMuted, center ? 'middle' : undefined) : ''
}

/** Ảnh tròn (người đã mất dùng bản xám); không có ảnh thì chữ cái đầu trên nền theo tông như màn hình. */
function avatarSvg(member: TreeMember, cx: number, cy: number, size: number, tone: CardTone, input: SceneInput): string {
  const { colors, photos } = input
  const url = member.avatarUrl
  const photo = url && photos ? ((member.isDeceased ? photos.get(grayKey(url)) : undefined) ?? photos.get(url)) : undefined
  if (photo) {
    const x = cx - size / 2
    const y = cy - size / 2
    return `<image${attrs({ x, y, width: size, height: size, href: photo, 'xlink:href': photo })}/>`
  }
  // Khớp TONE_AVATAR_CLASS: màu viền của tông pha 25%; chưa rõ giới tính dùng nền secondary
  const circle =
    tone === 'unknown'
      ? attrs({ cx, cy, r: size / 2, fill: colors.secondary })
      : attrs({ cx, cy, r: size / 2, fill: colors.tones[tone].border, 'fill-opacity': 0.25 })
  const textFill = tone === 'unknown' ? colors.secondaryFg : tone === 'gone' ? colors.textMuted : colors.text
  return `<circle${circle}/>` + textEl(cx, cy + 6, initialOf(member.fullName), 16, true, textFill, 'middle')
}

/** Nhãn đặc biệt đè lên viền trên của ô: ô dọc ở góc phải, ô ngang cách mép phải 12. */
function labelSvg(member: TreeMember, x: number, y: number, W: number, vertical: boolean, colors: PrintColors): string {
  const firstLabel = member.labels[0]
  if (!firstLabel) return ''
  const extra = member.labels.length - 1
  const label = fit(extra > 0 ? `${firstLabel} +${extra}` : firstLabel, Math.max(40, W * 0.7 - 16), 13, true)
  const w = measure(label, 13, true) + 16
  const px = vertical ? x + W + 8 - w : x + W - 12 - w
  return (
    `<rect${attrs({ x: px, y: y - 9, width: w, height: 18, rx: 9, fill: colors.warningBg })}/>` +
    textEl(px + w / 2, y + 4, label, 13, true, colors.warning, 'middle')
  )
}

// Khớp MemberNode/nodeSize.ts (#102): ảnh 44, cách tên 6, tên 15px dòng 20 (đủ số dòng), năm 13px dòng 18, đệm trên 10, dưới 12
const V_PHOTO = 44
const V_TOP = 10
const V_BOTTOM = 12

/** Thẻ dọc hẹp (#100, #102): ảnh tròn trên cùng, tên căn giữa đủ số dòng, năm sinh–mất sát đáy. */
function verticalNodeContent(member: TreeMember, x: number, y: number, W: number, H: number, tone: CardTone, input: SceneInput): string {
  const { colors, look } = input
  const cx = x + W / 2
  let out = ''
  let top = y + V_TOP
  if (look.card.photo) {
    out += avatarSvg(member, cx, top + V_PHOTO / 2, V_PHOTO, tone, input)
    top += V_PHOTO + 6
  }
  wrapName(member.fullName, W - 16, 15, Infinity).forEach((line, i) => {
    out += textEl(cx, top + 15 + i * 20, line, 15, true, colors.text, 'middle')
  })
  if (look.card.years) out += yearsSvg(member, cx, y + H - V_BOTTOM - 4, 13, colors, true)
  if (look.card.labels) out += labelSvg(member, x, y, W, true, colors)
  return out
}

const AVATAR = 40
const AVATAR_PAD = 8

function nodeSvg(placed: PlacedNode, ox: number, oy: number, input: SceneInput): string {
  const { colors, look } = input
  const { width: W, height: H } = placed
  const x = ox + placed.x
  const y = oy + placed.y
  const member = placed.node.member
  const tone = cardTone(placed.node)
  const palette = colors.tones[tone]

  const out = `<rect${attrs({
    x,
    y,
    width: W,
    height: H,
    rx: Math.min(SHAPE_RADIUS[look.shape], W / 2, H / 2),
    fill: palette.bg,
    stroke: palette.border,
    'stroke-width': 2,
    'stroke-dasharray': member === null ? '6 4' : undefined,
  })}/>`

  if (member === null) return out + textEl(x + W / 2, y + H / 2 + 5, treeStrings.emptySlot, 16, false, colors.textMuted, 'middle')

  // Như MemberNode: nội dung dựng ở cỡ chuẩn (khung W/k × H/k) rồi phóng theo cỡ Nhỏ/Vừa/Lớn
  const k = look.scale
  const content = input.verticalOf(placed.id)
    ? verticalNodeContent(member, 0, 0, W / k, H / k, tone, input)
    : horizontalNodeContent(member, W / k, H / k, tone, input)
  return out + `<g transform="translate(${num(x)} ${num(y)}) scale(${num(k)})">${content}</g>`
}

/** Thẻ ngang: ảnh bên trái, tên và năm bên phải; tọa độ tính từ góc ô (0, 0). */
function horizontalNodeContent(member: TreeMember, W: number, H: number, tone: CardTone, input: SceneInput): string {
  const { colors, look } = input
  const x = 0
  const y = 0
  let out = ''
  const withAvatar = look.card.photo
  const textX = withAvatar ? x + AVATAR_PAD + AVATAR + 8 : x + 12
  const textWidth = x + W - 8 - textX
  if (withAvatar) out += avatarSvg(member, x + AVATAR_PAD + AVATAR / 2, y + H / 2, AVATAR, tone, input)

  const lines = wrapName(member.fullName, textWidth, 16)
  const hasYears = look.card.years && yearsText(member) !== ''
  const block = lines.length * 19 + (hasYears ? 18 : 0)
  const top = y + (H - block) / 2
  lines.forEach((line, i) => {
    out += textEl(textX, top + 15 + i * 19, line, 16, true, colors.text)
  })
  if (hasYears) out += yearsSvg(member, textX, top + lines.length * 19 + 14, 14, colors)
  if (look.card.labels) out += labelSvg(member, x, y, W, false, colors)
  return out
}

/** Hôn nhân màu `tree-marriage`, nét đứt khi cặp không kề nhau; cha mẹ–con màu `tree-line` (#100, giống TreeEdge). */
function edgeSvg(edge: LayoutEdge, ox: number, oy: number, colors: PrintColors, showOrder: boolean) {
  const marriage = edge.kind === 'marriage'
  const stroke = marriage ? colors.marriage : colors.treeLine
  let out = `<polyline${attrs({
    points: edge.points.map((p) => `${num(ox + p.x)},${num(oy + p.y)}`).join(' '),
    fill: 'none',
    stroke,
    // Nét dày hơn màn hình một chút để còn rõ khi in nhỏ
    'stroke-width': 2,
    'stroke-linejoin': 'round',
    'stroke-dasharray': marriage && edge.points.length > 2 ? '6 4' : undefined,
  })}/>`
  if (showOrder && edge.anchor && edge.order !== null) {
    const cx = ox + edge.anchor.x
    const cy = oy + edge.anchor.y
    out += `<circle${attrs({ cx, cy, r: 11, fill: colors.surface, stroke, 'stroke-width': 1.5 })}/>`
    out += textEl(cx, cy + 4.5, String(edge.order), 12, true, colors.textMuted, 'middle')
  }
  return out
}

export async function buildScene(input: SceneInput): Promise<Scene> {
  const { layout, colors, signal } = input
  const sheet = sheetGeometry(layout)
  const { originX: ox, originY: oy } = sheet
  const items: SceneItem[] = []

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
      tree: true,
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
      tree: true,
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
      return { label, cy: oy + g.y + g.height / 2, labelWidth: measure(label, 14, true) }
    }),
  }
}

export type RenderOptions = {
  /** Nhúng font vào SVG (chỉ cần cho ảnh PNG; PDF nhúng font qua jsPDF). */
  fonts?: PrintFonts
  /** Cắt phần vẽ tràn ra ngoài trang (khi chia trang). */
  clip?: boolean
  /** Dời cụm cây sang phải (unit) để nằm giữa giấy, xem `PagePlan.shiftX`. */
  shiftX?: number
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
  const { colors, sheet } = scene
  const dx = options.shiftX ?? 0
  const treeView = { ...view, x: view.x - dx }
  const body: string[] = []

  // Đường gạch mờ theo hàng mỗi đời: từ cột "Đời" kéo tới mép phải cụm cây (đã dời)
  const guideX0 = SHEET.margin + SHEET.gutter - 8
  const guideX1 = sheet.width - SHEET.margin + dx
  for (const g of scene.generations) {
    if (g.cy < view.y - 1 || g.cy > view.y + view.h + 1) continue
    body.push(
      `<line${attrs({ x1: guideX0, y1: g.cy, x2: guideX1, y2: g.cy, stroke: colors.border, 'stroke-width': 1, 'stroke-dasharray': '2 6' })}/>`,
    )
  }

  body.push(...scene.items.filter((item) => !item.tree && intersects(item, view)).map((item) => item.svg))
  const tree = scene.items.filter((item) => item.tree && intersects(item, treeView)).map((item) => item.svg)
  if (tree.length > 0) body.push(dx ? `<g transform="translate(${num(dx)} 0)">${tree.join('')}</g>` : tree.join(''))

  // Nhãn "Đời" của mỗi hàng: ở cột trang đầu nằm trong lề trái, các cột sau lặp lại ở mép trang cho dễ ghép
  const labelX = view.x <= 0 ? SHEET.margin : view.x + 6
  for (const g of scene.generations) {
    if (g.cy < view.y - 16 || g.cy > view.y + view.h + 16) continue
    const w = g.labelWidth + 20
    body.push(
      `<rect${attrs({ x: labelX, y: g.cy - 13, width: w, height: 26, rx: 13, fill: colors.surface, stroke: colors.border, 'stroke-width': 1 })}/>`,
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
