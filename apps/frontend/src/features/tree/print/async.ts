// Chia nhỏ công việc nặng để giao diện không treo (500 ô): nhường luồng chính giữa các lô và cho phép dừng.
export function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException('Đã dừng', 'AbortError')
}

export async function yieldToBrowser(signal: AbortSignal) {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0))
  throwIfAborted(signal)
}

export const isAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'
