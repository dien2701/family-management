import { useQuery } from '@tanstack/react-query'
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
    queryFn: () => api.get(`/api/members/${memberId}/attachments`) as Promise<Schemas['Attachment'][]>,
  })
  const attachments = query.data ?? []
  const isLoading = query.isPending
  const loadAttachments = () => void query.refetch()

  return (
    <section className="rounded-card border border-border bg-surface p-4 shadow-card md:p-6">
      <h2 className="font-semibold text-lg mb-4">Tệp đính kèm</h2>
      
      <div className="space-y-6">
        {canEdit && (
          <FileUploadDropzone 
            memberId={memberId} 
            onUploadSuccess={() => loadAttachments()} 
          />
        )}
        
        {isLoading ? (
          <div className="flex justify-center p-4"><span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
        ) : (
          <AttachmentList 
            attachments={attachments} 
            onDeleteSuccess={() => loadAttachments()} 
          />
        )}
      </div>
    </section>
  )
}
