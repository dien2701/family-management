/**
 * Cắt vuông chính giữa rồi thu về tối đa `size` px, xuất WebP (JPEG nếu trình duyệt không mã hóa được WebP).
 * Nền trắng để ảnh PNG trong suốt không bị đen khi ra JPEG.
 */
export async function cropSquare(file: File, size = 512): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const side = Math.min(bitmap.width, bitmap.height)
  const out = Math.min(size, side)
  const canvas = document.createElement('canvas')
  canvas.width = out
  canvas.height = out
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Trình duyệt không xử lý được ảnh.')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, out, out)
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, out, out)
  bitmap.close()

  const toBlob = (type: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.9))
  let blob = await toBlob('image/webp')
  // Trình duyệt không hỗ trợ WebP sẽ trả PNG, nặng hơn nhiều
  if (blob?.type !== 'image/webp') blob = await toBlob('image/jpeg')
  if (!blob) throw new Error('Không xử lý được ảnh.')
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  return new File([blob], `avatar.${ext}`, { type: blob.type })
}
