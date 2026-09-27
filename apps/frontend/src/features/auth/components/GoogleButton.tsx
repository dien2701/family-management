import { useEffect, useRef, useState } from 'react'
import { ApiError } from '@/services/client'
import { GOOGLE_CLIENT_ID } from '../googleConfig'
import { useGoogleLogin } from '../hooks'
import { authStrings } from '../strings'

const CLIENT_ID = GOOGLE_CLIENT_ID
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

let scriptPromise: Promise<void> | null = null
let credentialHandler: ((credential: string) => void) | null = null
let initialized = false

function loadScript(): Promise<void> {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Không tải được Google Identity Services'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

type GoogleButtonProps = {
  text: 'signin_with' | 'signup_with'
  /** Báo lỗi đăng nhập Google lên form cha (hiện ở banner đầu form). */
  onError: (message: string) => void
}

// Google chỉ cấp ID token qua nút do chính Google vẽ; backend xác minh token rồi phát JWT của hệ thống (DECISIONS #15)
export function GoogleButton({ text, onError }: GoogleButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const { mutate } = useGoogleLogin()
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onErrorRef.current = onError
  })

  useEffect(() => {
    credentialHandler = (idToken) =>
      mutate(
        { idToken },
        {
          onError: (error) =>
            onErrorRef.current(
              error instanceof ApiError ? error.message : 'Đăng nhập Google không thành công.',
            ),
        },
      )
    return () => {
      credentialHandler = null
    }
  }, [mutate])

  useEffect(() => {
    const container = containerRef.current
    if (!CLIENT_ID || !container) return
    let cancelled = false
    loadScript()
      .then(() => {
        const gsi = window.google?.accounts.id
        if (cancelled || !gsi) return
        if (!initialized) {
          gsi.initialize({
            client_id: CLIENT_ID,
            callback: (response) => {
              if (response.credential) credentialHandler?.(response.credential)
            },
          })
          initialized = true
        }
        // Nút Google rộng tối đa 400px
        const width = Math.min(400, Math.max(200, Math.floor(container.clientWidth)))
        container.replaceChildren()
        gsi.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          width,
          locale: 'vi',
        })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [text])

  if (!CLIENT_ID) return null
  if (failed)
    return <p className="text-center text-sm text-text-muted">{authStrings.google.loadFailed}</p>
  return <div ref={containerRef} className="flex min-h-11 w-full justify-center" />
}
