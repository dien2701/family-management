// Ảnh đại diện cho bản in: tải về, cắt vuông, bo tròn rồi đổi sang PNG 128px nền trong suốt (jsPDF không đọc được
// WebP, SVG dựng thành ảnh không tự tải được ảnh ngoài; nền trong suốt để góc ảnh không lộ ra trên nền màu của ô).
// Ảnh nào lỗi thì bỏ qua, ô đó dùng avatar chữ.
import { throwIfAborted } from './async'

const SIZE = 128
const BATCH = 6

/** Khóa của bản xám (người đã mất, #100) trong map ảnh. */
export const grayKey = (url: string) => `gray:${url}`

async function toPng(url: string, gray: boolean, signal: AbortSignal): Promise<string | null> {
  const response = await fetch(url, { signal })
  if (!response.ok) return null
  const bitmap = await createImageBitmap(await response.blob())
  try {
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2)
    ctx.clip()
    if (gray) ctx.filter = 'grayscale(1)'
    // object-fit: cover
    const side = Math.min(bitmap.width, bitmap.height)
    ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
    return canvas.toDataURL('image/png')
  } finally {
    bitmap.close()
  }
}

/** Khóa là URL gốc của ảnh; URL nằm trong `grayUrls` thì lưu bản xám dưới khóa `grayKey(url)`. */
export async function loadPhotos(
  urls: string[],
  signal: AbortSignal,
  onProgress: (done: number, total: number) => void,
  grayUrls: ReadonlySet<string> = new Set(),
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  let done = 0
  onProgress(0, urls.length)
  for (let i = 0; i < urls.length; i += BATCH) {
    await Promise.all(
      urls.slice(i, i + BATCH).map(async (url) => {
        try {
          const gray = grayUrls.has(url)
          const png = await toPng(url, gray, signal)
          if (png) result.set(gray ? grayKey(url) : url, png)
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
