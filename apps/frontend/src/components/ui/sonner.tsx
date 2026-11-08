import type { CSSProperties } from 'react'
import { Toaster as Sonner } from 'sonner'

// Toast (DESIGN §6): màu lấy từ token nên tự theo giao diện sáng/tối; đặt trên cùng để không đè thanh điều hướng dưới
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton
      toastOptions={{ className: 'font-sans text-base' }}
      style={
        {
          '--normal-bg': 'var(--color-surface)',
          '--normal-text': 'var(--color-text)',
          '--normal-border': 'var(--color-border)',
          '--success-bg': 'var(--color-success-bg)',
          '--success-text': 'var(--color-success)',
          '--success-border': 'var(--color-success)',
          '--error-bg': 'var(--color-danger-bg)',
          '--error-text': 'var(--color-danger)',
          '--error-border': 'var(--color-danger)',
          '--border-radius': '12px',
        } as CSSProperties
      }
    />
  )
}
