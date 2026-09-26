import { useState } from 'react'
import { FileText, Download, Trash2, X, FileImage, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApi } from '@/services/api'
import { toast } from '@/components/ui/use-toast'
import type { Schemas } from '@/types/api'
import { useViewer } from '@/features/auth/hooks'

type AttachmentListProps = {
  attachments: Schemas['Attachment'][]
  onDeleteSuccess?: (id: number) => void
  className?: string
}

export function AttachmentList({ attachments, onDeleteSuccess, className }: AttachmentListProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const api = useApi()
  const { data: viewer } = useViewer()
  const isAdmin = viewer?.role === 'ADMIN'

  const images = attachments.filter(a => a.mimeType.startsWith('image/'))
  const documents = attachments.filter(a => !a.mimeType.startsWith('image/'))

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tệp đính kèm này không?')) return

    setDeletingId(id)
    try {
      await api.delete(`/api/attachments/${id}`)
      toast({ title: 'Thành công', description: 'Đã xóa tệp đính kèm.' })
      onDeleteSuccess?.(id)
    } catch (err: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi', 
        description: err.body?.detail || 'Không thể xóa tệp.' 
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = async (attachment: Schemas['Attachment']) => {
    try {
      // Gọi API tải về, chế độ mock sẽ báo lỗi 503
      await api.get(`/api/attachments/${attachment.id}/download`)
    } catch (err: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi tải xuống', 
        description: err.body?.detail || 'Không thể tải tệp về.' 
      })
    }
  }

  if (attachments.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-muted-foreground', className)}>
        <FileText className="mb-2 h-8 w-8 opacity-20" />
        <p className="text-sm">Chưa có tệp đính kèm nào</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {images.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Hình ảnh</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {images.map((img) => (
              <div 
                key={img.id} 
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-md border bg-muted"
                onClick={() => setLightboxImage(img.url)}
              >
                {/* Fallback khi url lỗi hoặc chưa có ảnh thật */}
                <div className="absolute inset-0 flex items-center justify-center bg-accent">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                </div>
                {img.url && (
                  <img
                    src={img.url}
                    alt={img.title || img.fileName}
                    className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                )}
                
                {/* Overlay actions */}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDownload(img) }}
                    className="text-white hover:text-primary"
                    title="Tải về"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(img.id) }}
                      className="text-white hover:text-destructive disabled:opacity-50"
                      disabled={deletingId === img.id}
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Tài liệu</h3>
          <div className="flex flex-col gap-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent/50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-accent">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-medium" title={doc.title || doc.fileName}>
                    {doc.title || doc.fileName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB • {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={() => {
                      if (doc.mimeType === 'application/pdf') {
                        // Demo mở tab mới (sẽ bị lỗi nếu URL không hợp lệ do mock)
                        window.open(doc.url || '#', '_blank')
                      } else {
                        handleDownload(doc)
                      }
                    }}
                    title={doc.mimeType === 'application/pdf' ? 'Mở thẻ mới' : 'Tải về'}
                  >
                    {doc.mimeType === 'application/pdf' ? <FileImage className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      className="rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      disabled={deletingId === doc.id}
                      onClick={() => handleDelete(doc.id)}
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox đơn giản */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightboxImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img 
            src={lightboxImage} 
            alt="Preview" 
            className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  )
}
