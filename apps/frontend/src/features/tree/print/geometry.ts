// Hình học bản in (đơn vị "unit" là đơn vị của layoutTree, ô rộng 200). Hàm thuần: dùng chung cho hộp thoại (ước lượng)
// và bộ xuất PDF/PNG.
import type { LayoutResult } from '../layout/types'

export type PaperSize = 'A3' | 'A2'
export type Orientation = 'portrait' | 'landscape'
export type PrintFormat = 'pdf' | 'png'

export type PrintOptions = {
  /** Ô thuộc dòng làm gốc; `null` là in mọi cây. */
  rootNodeId: number | null
  paper: PaperSize
  orientation: Orientation
  withPhotos: boolean
  format: PrintFormat
}

export const PAPER_MM: Record<PaperSize, { w: number; h: number }> = {
  A3: { w: 297, h: 420 },
  A2: { w: 420, h: 594 },
}

/** Lề giấy (chỗ đặt dấu cắt và số trang). */
export const PAGE_MARGIN_MM = 12
/** Tỉ lệ in, mm trên mỗi unit: ô 200 unit rộng 28–50mm, chữ 16 unit cao 2,2–4mm. Nhỏ hơn mức tối thiểu thì chia trang. */
export const SCALE = { min: 0.14, max: 0.25 } as const

export const PNG = { dpi: 300, maxPixels: 16_000_000, maxSide: 16_384 } as const

/** Khoảng trống quanh sơ đồ, tiêu đề và cột "Đời" (đơn vị unit). */
export const SHEET = { margin: 40, title: 96, gutter: 96 } as const

export type Rect = { x: number; y: number; w: number; h: number }

export type SheetGeometry = {
  /** Góc trên trái của sơ đồ (ô đầu tiên) trong tờ. */
  originX: number
  originY: number
  width: number
  height: number
}

export function sheetGeometry(layout: LayoutResult): SheetGeometry {
  const originX = SHEET.margin + SHEET.gutter
  const originY = SHEET.margin + SHEET.title
  return {
    originX,
    originY,
    width: originX + layout.width + SHEET.margin,
    height: originY + layout.height + SHEET.margin,
  }
}

export const pageSizeMm = (paper: PaperSize, orientation: Orientation) => {
  const { w, h } = PAPER_MM[paper]
  return orientation === 'landscape' ? { w: h, h: w } : { w, h }
}

const clampScale = (fit: number) => Math.min(SCALE.max, Math.max(SCALE.min, fit))

export type PagePlan = {
  scale: number
  pageW: number
  pageH: number
  printW: number
  printH: number
  cols: number
  rows: number
  /** Kích thước một trang tính bằng unit. */
  tileW: number
  tileH: number
}

export function planPages(sheet: SheetGeometry, options: Pick<PrintOptions, 'paper' | 'orientation'>): PagePlan {
  const { w: pageW, h: pageH } = pageSizeMm(options.paper, options.orientation)
  const printW = pageW - PAGE_MARGIN_MM * 2
  const printH = pageH - PAGE_MARGIN_MM * 2
  const scale = clampScale(Math.min(printW / sheet.width, printH / sheet.height))
  // Trừ một chút sai số để tờ vừa khít không bị đẩy sang trang thừa
  const cols = Math.max(1, Math.ceil((sheet.width * scale) / printW - 1e-6))
  const rows = Math.max(1, Math.ceil((sheet.height * scale) / printH - 1e-6))
  return { scale, pageW, pageH, printW, printH, cols, rows, tileW: printW / scale, tileH: printH / scale }
}

export type PngPlan = { width: number; height: number; dpi: number }

/** Ảnh PNG cả tờ ở 300 dpi; quá giới hạn canvas của trình duyệt (nhất là iOS) thì hạ dpi. */
export function planPng(sheet: SheetGeometry, options: Pick<PrintOptions, 'paper' | 'orientation'>): PngPlan {
  const { scale } = planPages(sheet, options)
  const pixelsAt = (dpi: number) => {
    const perUnit = (scale / 25.4) * dpi
    return { width: Math.ceil(sheet.width * perUnit), height: Math.ceil(sheet.height * perUnit) }
  }
  let dpi: number = PNG.dpi
  let size = pixelsAt(dpi)
  const overflow = Math.max(
    Math.sqrt((size.width * size.height) / PNG.maxPixels),
    Math.max(size.width, size.height) / PNG.maxSide,
  )
  if (overflow > 1) {
    dpi = Math.max(1, Math.floor(dpi / overflow))
    size = pixelsAt(dpi)
  }
  return { ...size, dpi }
}
