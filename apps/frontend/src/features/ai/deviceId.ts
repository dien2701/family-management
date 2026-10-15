// Mã thiết bị để backend đếm lượt hỏi AI của khách (DECISIONS #91). Không phải bí mật, chỉ là nhãn ngẫu nhiên lưu
// trên máy; xóa dữ liệu trình duyệt là có mã mới (backend chấp nhận, chống dồn dập theo IP).
const KEY = 'giapha.deviceId'

let memoryId: string | null = null

function generate(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}0000`
}

export function getDeviceId(): string {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored) return stored
    const id = generate()
    localStorage.setItem(KEY, id)
    return id
  } catch {
    // Chế độ riêng tư chặn localStorage: giữ tạm trong bộ nhớ của phiên
    return (memoryId ??= generate())
  }
}

export const deviceHeaders = (): Record<string, string> => ({ 'X-Device-Id': getDeviceId() })
