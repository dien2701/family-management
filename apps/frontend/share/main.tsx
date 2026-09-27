// Cửa vào của bản xem thử một file (chạy được khi mở trực tiếp file://). Dùng lớp giả lập, tự đăng nhập,
// router dạng hash và có nút đổi vai trò Admin/User. Không dùng cho bản build thật.
import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router'
import { AuthProvider } from '@/context/AuthProvider'
import { routes } from '@/pages/routes'
import { queryClient } from '@/services/queryClient'
import './share.css'

const SESSION_KEY = 'giapha.mock.session'
const ROLE_KEY = 'giapha.mock.role'

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      // bỏ qua
    }
  },
}

if (!store.get(SESSION_KEY)) store.set(SESSION_KEY, JSON.stringify({ email: 'xemthu@tocpha.vn' }))

function mountRoleSwitcher() {
  const isUser = store.get(ROLE_KEY) === 'USER'
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = `Đang xem: ${isUser ? 'User' : 'Admin'} · bấm để đổi`
  button.style.cssText =
    'position:fixed;left:12px;bottom:76px;z-index:2147483000;padding:8px 12px;border-radius:999px;' +
    'border:1px solid rgba(0,0,0,.15);background:#24466F;color:#fff;font:600 12px system-ui,sans-serif;' +
    'box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer'
  button.onclick = () => {
    store.set(ROLE_KEY, isUser ? 'ADMIN' : 'USER')
    location.reload()
  }
  document.body.appendChild(button)
}

const router = createHashRouter(routes)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
mountRoleSwitcher()
