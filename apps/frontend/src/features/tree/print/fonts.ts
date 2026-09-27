// Font Be Vietnam Pro dạng TTF cho bản in: jsPDF chỉ nhúng được TTF (gói @fontsource chỉ có woff/woff2).
// Chỉ tải khi bấm "Tạo file" (URL do Vite cấp, không nằm trong bộ nhớ đệm offline).
import boldUrl from '@expo-google-fonts/be-vietnam-pro/700Bold/BeVietnamPro_700Bold.ttf?url'
import regularUrl from '@expo-google-fonts/be-vietnam-pro/400Regular/BeVietnamPro_400Regular.ttf?url'

/** Tên họ font dùng trong SVG, jsPDF và canvas đo chữ (khác tên font của giao diện để không lẫn). */
export const PRINT_FONT = 'BeVietnamPro'

export type PrintFonts = { regular: ArrayBuffer; bold: ArrayBuffer }

let cached: Promise<PrintFonts> | null = null

async function fetchBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`font ${response.status}`)
  return response.arrayBuffer()
}

export function loadPrintFonts(): Promise<PrintFonts> {
  cached ??= (async () => {
    const [regular, bold] = await Promise.all([fetchBuffer(regularUrl), fetchBuffer(boldUrl)])
    // Đăng ký vào trang để canvas đo được độ rộng chữ khi ngắt dòng
    const faces = [
      new FontFace(PRINT_FONT, regular.slice(0), { weight: '400' }),
      new FontFace(PRINT_FONT, bold.slice(0), { weight: '700' }),
    ]
    await Promise.all(faces.map((face) => face.load()))
    faces.forEach((face) => document.fonts.add(face))
    return { regular, bold }
  })().catch((error: unknown) => {
    cached = null
    throw error
  })
  return cached
}

export function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}
