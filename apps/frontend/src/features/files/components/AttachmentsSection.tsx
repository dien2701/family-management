import { useState, useEffect } from 'react'
import { FileUploadDropzone } from './FileUploadDropzone'
import { AttachmentList } from './AttachmentList'
import { useApi } from '@/services/api'
import type { Schemas } from '@/types/api'

type AttachmentsSectionProps = {
  memberId: number
  canEdit: boolean
}

export function AttachmentsSection({ memberId, canEdit }: AttachmentsSectionProps) {
  const [attachments, setAttachments] = useState<Schemas['Attachment'][]>([])
  const [isLoading, setIsLoading] = useState(true)
  const api = useApi()

  const loadAttachments = async () => {
    setIsLoading(true)
    try {
      const data = await api.get(`/api/members/${memberId}/attachments`)
      setAttachments(data as Schemas['Attachment'][])
    } catch (e) {
      // Ignore errors in mock for now
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAttachments()
  }, [memberId, api])

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
