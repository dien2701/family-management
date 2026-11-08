import { useQuery } from '@tanstack/react-query'
import { Paperclip } from 'lucide-react'
import { SectionCard } from '@/components/shared/SectionCard'
import { FileUploadDropzone } from './FileUploadDropzone'
import { AttachmentList } from './AttachmentList'
import { useApi } from '@/services/api'
import type { Schemas } from '@/types/api'

type AttachmentsSectionProps = {
  memberId: number
  canEdit: boolean
}

export function AttachmentsSection({ memberId, canEdit }: AttachmentsSectionProps) {
  const api = useApi()
  const query = useQuery({
    queryKey: ['attachments', 'member', memberId],
    queryFn: () =>
      api.get(`/api/members/${memberId}/attachments`) as Promise<Schemas['Attachment'][]>,
  })
  const attachments = query.data ?? []
  const isLoading = query.isPending
  const loadAttachments = () => void query.refetch()

  return (
    <SectionCard title="Tệp đính kèm" icon={Paperclip}>
      <div className="space-y-6">
        {canEdit && (
          <FileUploadDropzone memberId={memberId} onUploadSuccess={() => loadAttachments()} />
        )}

        {isLoading ? (
          <div className="flex justify-center p-4">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <AttachmentList attachments={attachments} onDeleteSuccess={() => loadAttachments()} />
        )}
      </div>
    </SectionCard>
  )
}
