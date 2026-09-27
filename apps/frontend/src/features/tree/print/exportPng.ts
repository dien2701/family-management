import { throwIfAborted } from './async'
import type { PrintFonts } from './fonts'
import type { PngPlan } from './geometry'
import { renderSvg, type Scene } from './scene'

/** PNG cả tờ: nhúng font vào SVG, dựng thành ảnh ở đúng số điểm ảnh của `plan` rồi vẽ lên canvas. */
export async function exportPng(scene: Scene, plan: PngPlan, fonts: PrintFonts, signal: AbortSignal): Promise<Blob> {
  const { sheet } = scene
  const svg = renderSvg(
    scene,
    { x: 0, y: 0, w: sheet.width, h: sheet.height },
    { width: plan.width, height: plan.height },
    { fonts },
  )
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    throwIfAborted(signal)

    const canvas = document.createElement('canvas')
    canvas.width = plan.width
    canvas.height = plan.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas')
    ctx.drawImage(image, 0, 0, plan.width, plan.height)
    throwIfAborted(signal)

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('png'))), 'image/png'),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}
