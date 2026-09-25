import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Alert } from '@/components/shared/Alert'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/services/client'
import type { Relative } from '@/types/api'
import { useDeleteRelative, useRelatives } from '../hooks'
import { memberStrings } from '../strings'
import { AddRelativeDialog } from './AddRelativeDialog'
import { EditRelativeDialog } from './EditRelativeDialog'

type RelativesSectionProps = {
  memberId: number
  /** Chủ hồ sơ hoặc Admin: thêm, sửa nhãn và xóa được. Người khác chỉ xem. */
  canEdit: boolean
}

/** Khối "Người thân" trên hồ sơ: danh sách "Tên — nhãn" một chiều (IDEA §6.2, DECISIONS #75). */
export function RelativesSection({ memberId, canEdit }: RelativesSectionProps) {
  const s = memberStrings.relatives
  const relatives = useRelatives(memberId)
  const remove = useDeleteRelative(memberId)
  // Mỗi lần mở hộp thêm dùng một `key` mới để hộp về trạng thái ban đầu
  const [addSession, setAddSession] = useState(0)
  const [adding, setAdding] = useState(false)
  const [editSession, setEditSession] = useState(0)
  const [editing, setEditing] = useState<Relative | null>(null)
  const [removing, setRemoving] = useState<Relative | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const items = relatives.data ?? []

  const closeRemove = () => {
    if (remove.isPending) return
    setRemoving(null)
    setRemoveError(null)
  }

  const confirmRemove = async () => {
    if (!removing) return
    setRemoveError(null)
    try {
      await remove.mutateAsync(removing.id)
      setRemoving(null)
    } catch (e) {
      setRemoveError(e instanceof ApiError ? e.message : s.failed)
    }
  }

  return (
    <section
      aria-labelledby="relatives-title"
      className="rounded-card border border-border bg-surface p-4 shadow-card md:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="relatives-title" className="text-lg font-semibold">
          {s.title}
        </h2>
        {canEdit && (
          <Button
            variant="secondary"
            onClick={() => {
              setAddSession((n) => n + 1)
              setAdding(true)
            }}
          >
            <Plus aria-hidden="true" />
            {s.add}
          </Button>
        )}
      </div>

      <div className="mt-3">
        {relatives.isPending ? (
          <div role="status" aria-label={s.loading} className="flex flex-col gap-2">
            {[0, 1].map((i) => (
              <div key={i} aria-hidden="true" className="h-12 animate-pulse rounded-field bg-surface-muted" />
            ))}
          </div>
        ) : relatives.isError ? (
          <div className="flex flex-col items-start gap-3">
            <Alert className="w-full">{s.loadFailed}</Alert>
            <Button variant="secondary" onClick={() => void relatives.refetch()}>
              {s.retry}
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="text-text-muted">{canEdit ? s.emptyEditable : s.empty}</p>
        ) : (
          <ul aria-label={s.listLabel}>
            {items.map((row) => (
              <li
                key={row.id}
                className="flex min-h-12 items-center gap-2 border-b border-border py-1 last:border-b-0"
              >
                <p className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                  <Link
                    to={`/thanh-vien/${row.relative.id}`}
                    className="font-semibold text-accent-text underline-offset-2 hover:underline"
                  >
                    {row.relative.fullName}
                  </Link>
                  <span className="text-text-muted">
                    {' '}
                    {s.separator} {row.label}
                  </span>
                </p>
                {canEdit && (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={s.edit(row.relative.fullName)}
                      onClick={() => {
                        setEditSession((n) => n + 1)
                        setEditing(row)
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={s.remove(row.relative.fullName)}
                      className="text-danger"
                      onClick={() => setRemoving(row)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {canEdit && !relatives.isError && <p className="mt-3 text-sm text-text-muted">{s.oneWayHint}</p>}
      </div>

      <AddRelativeDialog
        key={addSession}
        open={adding}
        memberId={memberId}
        existing={items}
        onClose={() => setAdding(false)}
      />
      <EditRelativeDialog
        key={editSession}
        memberId={memberId}
        relative={editing}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={removing !== null}
        danger
        title={s.removeTitle}
        description={removing ? s.removeDescription(removing.relative.fullName, removing.label) : ''}
        confirmLabel={s.removeConfirm}
        cancelLabel={s.removeCancel}
        loading={remove.isPending}
        error={removeError}
        onConfirm={() => void confirmRemove()}
        onCancel={closeRemove}
      />
    </section>
  )
}
