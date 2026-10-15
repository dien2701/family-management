import { initialOf } from '@/utils/text'

type UserAvatarProps = {
  url?: string | null
  name?: string | null
  /** Kích thước và cỡ chữ cái đầu, ví dụ `size-10 text-base`. */
  className: string
}

/** Ảnh tròn của tài khoản; chưa có ảnh thì hiện chữ cái đầu của tên. */
export function UserAvatar({ url, name, className }: UserAvatarProps) {
  if (url) {
    return <img src={url} alt="" className={`${className} shrink-0 rounded-full bg-surface-muted object-cover`} />
  }
  return (
    <span
      aria-hidden="true"
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-fg`}
    >
      {initialOf(name ?? undefined)}
    </span>
  )
}
