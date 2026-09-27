import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'

/** Nút đảo sáng ↔ tối trên header; chọn "theo máy" ở trang Cài đặt. */
export function ThemeToggle() {
  const { isDark, toggle } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={isDark ? 'Giao diện sáng' : 'Giao diện tối'}
      onClick={toggle}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
