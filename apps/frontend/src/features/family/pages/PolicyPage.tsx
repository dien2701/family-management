import { ArrowLeft, TreeDeciduous } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { useRouteTitle } from '@/hooks/useRouteTitle'
import { POLICY_VERSION } from '../strings'
import { policySections } from '../policyContent'

// Trang tĩnh, công khai (cả người chưa đăng nhập cũng đọc được) nên nằm ngoài các route guard.
export function PolicyPage() {
  useRouteTitle()
  const { status } = useAuth()
  // Có phiên thì "quay lại" về trang chính, chưa có thì về đăng nhập; link mở ở tab mới nên không dùng history.
  const backTo = status === 'authenticated' ? '/' : '/dang-nhap'

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4 md:px-6">
          <span className="flex size-10 items-center justify-center rounded-button bg-primary text-primary-fg">
            <TreeDeciduous className="size-6" aria-hidden="true" />
          </span>
          <span className="text-lg leading-tight font-bold text-primary">Tộc Phả</span>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-6">
        <Link
          to={backTo}
          className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-button px-2 font-semibold text-accent-text hover:bg-surface-muted"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
          Quay lại
        </Link>

        <article className="mt-2 rounded-card border border-border bg-surface p-4 shadow-card md:p-6">
          <h1 className="text-xl leading-tight font-bold md:text-2xl">Chính sách bảo mật</h1>
          <p className="mt-2 text-sm text-text-muted">
            Phiên bản {POLICY_VERSION} · Áp dụng theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá
            nhân
          </p>

          <div className="mt-6 flex flex-col gap-6">
            {policySections.map((section) => (
              <section key={section.title} aria-labelledby={section.id}>
                <h2 id={section.id} className="text-lg leading-tight font-semibold">
                  {section.title}
                </h2>
                {section.intro && <p className="mt-2">{section.intro}</p>}
                {section.items && (
                  <ul className="mt-2 list-disc space-y-1 pl-6">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.outro && <p className="mt-2">{section.outro}</p>}
              </section>
            ))}
          </div>
        </article>
      </main>
    </div>
  )
}
