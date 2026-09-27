import { useQuery } from '@tanstack/react-query'
import { FileUploadDropzone } from '../components/FileUploadDropzone'
import { AttachmentList } from '../components/AttachmentList'
import { QuotaMeter } from '../components/QuotaMeter'
import { useApi } from '@/services/api'
import type { Schemas } from '@/types/api'
import { useMe } from '@/hooks/useMe'

export function CommonDocumentsPage() {
  const api = useApi()
  const { data: viewer } = useMe()
  const isAdmin = viewer?.systemRole === 'ADMIN'

  const attachmentsQuery = useQuery({
    queryKey: ['attachments', 'common'],
    queryFn: () => api.get('/api/attachments/common') as Promise<Schemas['Attachment'][]>,
  })
  const quotaQuery = useQuery({
    queryKey: ['files', 'quota'],
    queryFn: () => api.get('/api/files/quota') as Promise<Schemas['QuotaResponse']>,
    enabled: isAdmin,
  })
  const attachments = attachmentsQuery.data ?? []
  const quota = quotaQuery.data
  const isLoading = attachmentsQuery.isPending
  const loadData = () => {
    void attachmentsQuery.refetch()
    void quotaQuery.refetch()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-8 space-y-6">
      <h1 className="text-2xl font-bold">Tài liệu chung</h1>
      
      {isAdmin && quota && (
        <section className="rounded-card border border-border bg-surface p-4 shadow-card md:p-6">
          <QuotaMeter usedMb={quota.usedMb} limitMb={quota.limitMb} />
        </section>
      )}

      <section className="rounded-card border border-border bg-surface p-4 shadow-card md:p-6 space-y-6">
        {isAdmin && (
          <FileUploadDropzone 
            memberId={null} 
            onUploadSuccess={() => loadData()} 
          />
        )}
        
        {isLoading ? (
          <div className="flex justify-center p-4">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <AttachmentList 
            attachments={attachments} 
            onDeleteSuccess={() => loadData()} 
          />
        )}
      </section>
    </div>
  )
}
