import { toast as sonner } from 'sonner'

type ToastInput = { title: string; description?: string; variant?: 'default' | 'destructive' }

export function toast({ title, description, variant }: ToastInput) {
  if (variant === 'destructive') sonner.error(title, { description })
  else sonner.success(title, { description })
}
