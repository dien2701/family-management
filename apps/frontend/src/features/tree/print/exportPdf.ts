import { treeStrings } from '../strings'
import { yieldToBrowser } from './async'
import { PRINT_FONT, toBase64, type PrintFonts } from './fonts'
import { PAGE_MARGIN_MM, type PagePlan, type PrintOptions } from './geometry'
import { renderSvg, type Scene } from './scene'

const CROP_MARK_MM = 5

/**
 * PDF vector: mỗi trang là một vùng của tờ, vẽ bằng svg2pdf (chữ nhúng font Be Vietnam Pro). Cây lớn chia nhiều trang,
 * có dấu cắt ở bốn góc vùng in và số trang/hàng/cột ở lề dưới để ghép.
 */
export async function exportPdf(
  scene: Scene,
  plan: PagePlan,
  options: Pick<PrintOptions, 'paper' | 'orientation'>,
  fonts: PrintFonts,
  signal: AbortSignal,
  onProgress: (done: number, total: number) => void,
): Promise<Blob> {
  const [{ jsPDF }, { svg2pdf }] = await Promise.all([import('jspdf'), import('svg2pdf.js')])

  const doc = new jsPDF({ orientation: options.orientation, unit: 'mm', format: options.paper.toLowerCase(), compress: true })
  doc.addFileToVFS('BeVietnamPro-Regular.ttf', toBase64(fonts.regular))
  doc.addFont('BeVietnamPro-Regular.ttf', PRINT_FONT, 'normal')
  doc.addFileToVFS('BeVietnamPro-Bold.ttf', toBase64(fonts.bold))
  doc.addFont('BeVietnamPro-Bold.ttf', PRINT_FONT, 'bold')

  // svg2pdf cần phần tử đã gắn vào trang để tính kiểu chữ; đặt ngoài màn hình
  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = 'position:fixed;left:-100000px;top:0;pointer-events:none'
  document.body.append(host)

  const total = plan.cols * plan.rows
  const tiled = total > 1
  const m = PAGE_MARGIN_MM

  try {
    let page = 0
    for (let row = 0; row < plan.rows; row += 1) {
      for (let col = 0; col < plan.cols; col += 1) {
        if (page > 0) doc.addPage()
        page += 1
        onProgress(page - 1, total)

        const view = { x: col * plan.tileW, y: row * plan.tileH, w: plan.tileW, h: plan.tileH }
        const svg = renderSvg(scene, view, { width: plan.printW, height: plan.printH }, { clip: tiled })
        const element = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement
        host.replaceChildren(document.importNode(element, true))
        await svg2pdf(host.firstElementChild as SVGElement, doc, { x: m, y: m, width: plan.printW, height: plan.printH })

        if (tiled) {
          doc.setDrawColor(0)
          doc.setLineWidth(0.2)
          for (const [cx, dx] of [
            [m, -1],
            [m + plan.printW, 1],
          ] as const) {
            for (const [cy, dy] of [
              [m, -1],
              [m + plan.printH, 1],
            ] as const) {
              doc.line(cx, cy, cx + dx * CROP_MARK_MM, cy)
              doc.line(cx, cy, cx, cy + dy * CROP_MARK_MM)
            }
          }
          doc.setFont(PRINT_FONT, 'normal')
          doc.setFontSize(8)
          doc.setTextColor(90)
          doc.text(treeStrings.print.pageLabel(page, total, row + 1, col + 1), plan.pageW / 2, plan.pageH - 4, { align: 'center' })
        }
        await yieldToBrowser(signal)
      }
    }
    onProgress(total, total)
    return doc.output('blob')
  } finally {
    host.remove()
  }
}
