import { authStrings } from '../strings'

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-sm text-text-muted" role="separator">
      <span className="h-px flex-1 bg-border" />
      {authStrings.google.or}
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
