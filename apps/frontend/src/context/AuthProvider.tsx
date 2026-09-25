import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, configureSession, refreshSession, setAccessToken } from '@/services/client'
import type { AuthResponse, Me } from '@/types/api'
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext'

type Session = { status: AuthStatus; user: Me | null; loggedOut?: boolean }

const ANONYMOUS: Session = { status: 'anonymous', user: null }

/**
 * Giữ phiên đăng nhập. Access token chỉ nằm trong bộ nhớ (services/client.ts);
 * khi tải trang thì gọi `/auth/refresh` bằng cookie HttpOnly để khôi phục phiên.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSessionState] = useState<Session>({ status: 'loading', user: null })

  const applySession = useCallback((auth: AuthResponse) => {
    setAccessToken(auth.accessToken ?? null)
    setSessionState(
      auth.user && auth.accessToken ? { status: 'authenticated', user: auth.user } : ANONYMOUS,
    )
  }, [])

  useEffect(() => {
    configureSession({
      onRefreshed: (auth) => {
        if (auth.user) setSessionState({ status: 'authenticated', user: auth.user })
      },
      onExpired: () => {
        // Dữ liệu đã cache thuộc về phiên cũ nên xóa hết
        setSessionState(ANONYMOUS)
        queryClient.clear()
      },
    })
    // Trùng lời gọi (StrictMode) được gộp chung một request trong refreshSession
    refreshSession()
      .then((auth) => {
        if (!auth) setSessionState(ANONYMOUS)
      })
      .catch(() => setSessionState(ANONYMOUS))
    return () => configureSession(null)
  }, [queryClient])

  const setSession = useCallback(
    (auth: AuthResponse) => {
      queryClient.clear()
      applySession(auth)
    },
    [applySession, queryClient],
  )

  const refresh = useCallback(async () => {
    try {
      const auth = await refreshSession()
      if (!auth) setSessionState(ANONYMOUS)
      return auth !== null
    } catch {
      // Mất mạng: giữ phiên hiện tại, người gọi tự báo lỗi
      return false
    }
  }, [])

  const updateUser = useCallback((user: Me) => {
    setSessionState((current) => (current.status === 'authenticated' ? { ...current, user } : current))
  }, [])

  const logout = useCallback(async () => {
    // Refresh cookie chỉ bị thu hồi khi server nhận được lời gọi này, nên lỗi thì không xóa phiên phía trình duyệt
    await api.post('/auth/logout')
    setAccessToken(null)
    setSessionState({ ...ANONYMOUS, loggedOut: true })
    queryClient.clear()
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({ ...session, setSession, refresh, updateUser, logout }),
    [session, setSession, refresh, updateUser, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
