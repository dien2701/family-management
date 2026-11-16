// Điều phối bản in: `prepareScene` (font → ảnh → dựng tờ) dùng cho cả màn xem trước lẫn xuất file, rồi `exportPrepared`
// (PDF hoặc PNG). Tách khỏi giao diện và tải bằng import động để trang Cây không phải nạp jsPDF/svg2pdf khi chưa cần.
import type { CardLook } from '../cardStyle'
import { treeStrings } from '../strings'
import type { LayoutResult } from '../layout/types'
import { exportPdf } from './exportPdf'
import { exportPng } from './exportPng'
import { loadPrintFonts, type PrintFonts } from './fonts'
import { planPages, planPng, type PrintOptions } from './geometry'
import { loadPhotos } from './photos'
import { buildScene, readPrintColors, type Scene } from './scene'

const s = treeStrings.print

export type PrepareRun = {
  layout: LayoutResult
  withPhotos: boolean
  /** Ô nào hiển thị dọc (giống màn hình). */
  verticalOf: (nodeId: number) => boolean
  /** Bảng màu, hình dạng, thông tin trên ô (giống màn hình). */
  look: CardLook
  /** Tên người gốc đang chọn; `null` là in toàn cây. */
  rootName: string | null
  signal: AbortSignal
  onStage: (text: string) => void
}

export type PreparedScene = { scene: Scene; fonts: PrintFonts }

const pad = (n: number) => String(n).padStart(2, '0')

export function todayText(): string {
  const now = new Date()
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`
}

export async function prepareScene(run: PrepareRun): Promise<PreparedScene> {
  const { layout, signal, onStage } = run

  onStage(s.stages.fonts)
  const fonts = await loadPrintFonts()

  let photos: Map<string, string> | null = null
  // Ô đã tắt ảnh ở Cấu hình cây thì bản in cũng không có ảnh
  if (run.withPhotos && run.look.card.photo) {
    const members = layout.nodes.flatMap((n) => (n.node.member?.avatarUrl ? [n.node.member] : []))
    const urls = [...new Set(members.map((m) => m.avatarUrl as string))]
    // Người đã mất in ảnh xám như trên màn hình
    const gray = new Set(members.filter((m) => m.isDeceased).map((m) => m.avatarUrl as string))
    photos = await loadPhotos(urls, signal, (done, total) => onStage(s.stages.photos(done, total)), gray)
  }

  const people = layout.nodes.filter((n) => n.node.member !== null).length
  const scene = await buildScene({
    layout,
    colors: readPrintColors(run.look.palette),
    photos,
    verticalOf: run.verticalOf,
    look: run.look,
    title: run.rootName ? s.docTitleBranch(run.rootName) : s.docTitle,
    subtitle: s.docSubtitle(people, todayText()),
    signal,
    onProgress: (percent) => onStage(s.stages.layout(percent)),
  })
  return { scene, fonts }
}

export async function exportPrepared(
  { scene, fonts }: PreparedScene,
  options: PrintOptions,
  signal: AbortSignal,
  onStage: (text: string) => void,
): Promise<{ blob: Blob; fileName: string }> {
  const slug = s.orientationSlug[options.orientation]
  if (options.format === 'png') {
    onStage(s.stages.image)
    const blob = await exportPng(scene, planPng(scene.sheet, options), fonts, signal)
    return { blob, fileName: s.fileName(options.paper, slug, 'png') }
  }

  const blob = await exportPdf(scene, planPages(scene.sheet, options), options, fonts, signal, (done, total) =>
    onStage(s.stages.pages(Math.min(done + 1, total), total)),
  )
  return { blob, fileName: s.fileName(options.paper, slug, 'pdf') }
}
