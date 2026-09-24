import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useLeaveFamily } from '../hooks'
import { familyStrings as s } from '../strings'

// Mọi người đều có nút rời; Manager phải chuyển quyền trước (backend trả 409 MANAGER_MUST_TRANSFER)
export function LeaveSection({ isManager }: { isManager: boolean }) {
  const [open, setOpen] = useState(false)
  const leave = useLeaveFamily()

  return (
    <section className="rounded-card border border-border bg-surface p-4 shadow-card md:p-6">
      {isManager && <p className="mb-3 text-text-muted">{s.leave.managerBlocked}</p>}
      <Button
        variant="secondary"
        disabled={isManager}
        className="w-full text-danger md:w-auto"
        onClick={() => {
          leave.reset()
          setOpen(true)
        }}
      >
        <LogOut aria-hidden="true" />
        {s.leave.button}
      </Button>

      <ConfirmDialog
        open={open}
        danger
        title={s.leave.title}
        description={s.leave.description}
        confirmLabel={s.leave.button}
        cancelLabel={s.dialog.cancel}
        loading={leave.isPending}
        error={leave.isError ? leave.error.message : null}
        onCancel={() => setOpen(false)}
        onConfirm={() => leave.mutate()}
      />
    </section>
  )
}
