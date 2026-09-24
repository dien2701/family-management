import { QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { AuthProvider } from '@/context/AuthProvider'
import { routes } from '@/pages/routes'
import { queryClient } from '@/services/queryClient'

const router = createBrowserRouter(routes)

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
