import { useCallback, useSyncExternalStore } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type FontSize = 'normal' | 'large' | 'xlarge'

const THEME_KEY = 'tocpha.theme'
const FONT_KEY = 'tocpha.fontSize'
const listeners = new Set<() => void>()

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Trình duyệt chặn lưu: vẫn áp dụng cho phiên hiện tại
  }
}

const isMode = (v: string | null): v is ThemeMode => v === 'light' || v === 'dark' || v === 'system'
const isFont = (v: string | null): v is FontSize => v === 'normal' || v === 'large' || v === 'xlarge'

export const getThemeMode = (): ThemeMode => {
  const v = read(THEME_KEY)
  return isMode(v) ? v : 'system'
}

export const getFontSize = (): FontSize => {
  const v = read(FONT_KEY)
  return isFont(v) ? v : 'normal'
}

const systemDark = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches

export function resolveDark(mode: ThemeMode): boolean {
  return mode === 'dark' || (mode === 'system' && systemDark())
}

function apply() {
  const root = document.documentElement
  root.classList.toggle('dark', resolveDark(getThemeMode()))
  const font = getFontSize()
  if (font === 'normal') delete root.dataset.fontSize
  else root.dataset.fontSize = font
}

function emit() {
  apply()
  listeners.forEach((l) => l())
}

// Chế độ "theo máy": đổi giao diện hệ điều hành thì đổi theo
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getThemeMode() === 'system') emit()
  })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useTheme() {
  const mode = useSyncExternalStore(subscribe, getThemeMode, () => 'system' as ThemeMode)
  const fontSize = useSyncExternalStore(subscribe, getFontSize, () => 'normal' as FontSize)
  const isDark = resolveDark(mode)

  const setMode = useCallback((next: ThemeMode) => {
    write(THEME_KEY, next)
    emit()
  }, [])
  const setFontSize = useCallback((next: FontSize) => {
    write(FONT_KEY, next)
    emit()
  }, [])
  // Nút trên header: chỉ đảo sáng ↔ tối theo giao diện đang thấy
  const toggle = useCallback(() => setMode(resolveDark(getThemeMode()) ? 'light' : 'dark'), [setMode])

  return { mode, fontSize, isDark, setMode, setFontSize, toggle }
}
