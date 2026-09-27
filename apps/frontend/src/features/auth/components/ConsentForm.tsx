import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/shared/Alert'
import { Button } from '@/components/ui/button'
import { useAcceptConsent } from '../hooks'
import { authStrings as s } from '../strings'
import { ConsentCheckbox } from './ConsentCheckbox'

// Chỉ hiện khi `/api/me` báo `consentRequired` (đăng nhập Google lần đầu). Bắt tick rồi mới gọi API.
export function ConsentForm() {
  const accept = useAcceptConsent()
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState<string>()

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!checked) {
      setError(s.consent.required)
      return
    }
    setError(undefined)
    accept.mutate()
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-label={s.consent.title}
      className="flex flex-col gap-3 rounded-field bg-surface-muted p-4 text-left"
    >
      <p className="font-semibold">{s.consent.title}</p>
      <p className="text-sm text-text-muted">{s.consent.description}</p>
      {accept.isError && <Alert>{accept.error.message}</Alert>}
      <ConsentCheckbox
        checked={checked}
        onChange={(value) => {
          setChecked(value)
          if (value) setError(undefined)
        }}
        error={error}
      />
      <Button type="submit" loading={accept.isPending}>
        {s.consent.submit}
      </Button>
    </form>
  )
}
