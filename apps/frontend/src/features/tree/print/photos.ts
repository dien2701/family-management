// Ảnh đại diện cho bản in: tải về, cắt vuông, bo tròn rồi đổi sang JPEG 128px (jsPDF không đọc được WebP, và
// SVG dựng thành ảnh không tự tải được ảnh ngoài). Ảnh nào lỗi thì bỏ qua, ô đó dùng avatar chữ.
import { throwIfAborted } from './async'

const SIZE = 128
const BATCH = 6

async function toJpeg(url: string, signal: AbortSignal): Promise<string | null> {
  const response = await fetch(url, { signal })
  if (!response.ok) return null
  const bitmap = await createImageBitmap(await response.blob())
  try {
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2)
    ctx.clip()
    // object-fit: cover
    const side = Math.min(bitmap.width, bitmap.height)
    ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
    return canvas.toDataURL('image/jpeg', 0.85)
  } finally {
    bitmap.close()
  }
}

/** Khóa là URL gốc của ảnh. */
export async function loadPhotos(
  urls: string[],
  signal: AbortSignal,
  onProgress: (done: number, total: number) => void,
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  let done = 0
  onProgress(0, urls.length)
  for (let i = 0; i < urls.length; i += BATCH) {
    await Promise.all(
      urls.slice(i, i + BATCH).map(async (url) => {
        try {
          const jpeg = await toJpeg(url, signal)
          if (jpeg) result.set(url, jpeg)
        } catch {
          throwIfAborted(signal)
        }
        done += 1
      }),
    )
    throwIfAborted(signal)
    onProgress(done, urls.length)
  }
  return result
}
