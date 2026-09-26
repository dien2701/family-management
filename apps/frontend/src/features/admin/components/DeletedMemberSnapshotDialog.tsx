import { ModalDialog } from '@/components/shared/ModalDialog'
import { Badge } from '@/components/shared/Badge'
import { useDeletedMemberSnapshot } from '../hooks'

type DeletedMemberSnapshotDialogProps = {
  auditId: number
  onClose: () => void
}

export function DeletedMemberSnapshotDialog({ auditId, onClose }: DeletedMemberSnapshotDialogProps) {
  const { data: snapshot, isLoading, isError } = useDeletedMemberSnapshot(auditId)

  return (
    <ModalDialog open={true} title="Chi tiết bản sao đã xóa" onClose={onClose}>
      {isLoading && <div className="p-4 text-center text-text-muted">Đang tải...</div>}
      
      {isError && (
        <div className="p-4 text-center text-danger">
          Có lỗi xảy ra khi tải dữ liệu.
        </div>
      )}

      {snapshot && (
        <div className="flex flex-col gap-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold tracking-wide text-text-muted uppercase">Thông tin cá nhân</h3>
            <div className="rounded-lg border border-border bg-surface-muted/30 p-4 space-y-3 text-sm">
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-text-muted">Họ tên:</span>
                <span className="font-medium text-text">{snapshot.member.fullName}</span>
              </div>
              
              {snapshot.member.gender && (
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="text-text-muted">Giới tính:</span>
                  <span>{snapshot.member.gender === 'M' ? 'Nam' : 'Nữ'}</span>
                </div>
              )}
              
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-text-muted">Trạng thái:</span>
                <span>{snapshot.member.isDeceased ? 'Đã mất' : 'Còn sống'}</span>
              </div>

              {snapshot.member.birthYear && (
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="text-text-muted">Năm sinh:</span>
                  <span>{snapshot.member.birthYear}</span>
                </div>
              )}

              {snapshot.member.isDeceased && snapshot.member.deathYear && (
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="text-text-muted">Năm mất:</span>
                  <span>{snapshot.member.deathYear}</span>
                </div>
              )}

              {snapshot.member.labels.length > 0 && (
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="text-text-muted">Nhãn:</span>
                  <div className="flex flex-wrap gap-1">
                    {snapshot.member.labels.map(label => (
                      <Badge key={label} tone="neutral">{label}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {snapshot.member.biography && (
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <span className="text-text-muted">Tiểu sử:</span>
                  <p className="whitespace-pre-wrap leading-relaxed">{snapshot.member.biography}</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold tracking-wide text-text-muted uppercase">Người thân liên quan</h3>
            {snapshot.relations.length === 0 ? (
              <p className="text-sm text-text-muted italic">Không có thông tin người thân.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {snapshot.relations.map((rel, idx) => (
                  <li key={idx} className="flex gap-2 rounded border border-border bg-surface-muted/30 p-2">
                    <span className="font-medium text-text">{rel.label}</span>
                    <span className="text-text-muted">
                      (Người liên quan: {rel.relative.fullName})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold tracking-wide text-text-muted uppercase">Tệp đính kèm</h3>
            {snapshot.attachments.length === 0 ? (
              <p className="text-sm text-text-muted italic">Không có tệp đính kèm.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {snapshot.attachments.map((att) => (
                  <li key={att.id} className="flex items-center gap-2 rounded border border-border bg-surface-muted/30 p-2">
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary hover:underline truncate max-w-[200px]"
                    >
                      {att.fileName}
                    </a>
                    <span className="text-xs text-text-muted">
                      ({(att.sizeBytes / 1024).toFixed(1)} KB)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </ModalDialog>
  )
}
