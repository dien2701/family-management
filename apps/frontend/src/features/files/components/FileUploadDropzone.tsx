import { useState, useRef } from 'react'
import { UploadCloud, File as FileIcon, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApi } from '@/services/api'
import { toast } from '@/components/ui/use-toast'
import type { Schemas } from '@/types/api'

type FileUploadDropzoneProps = {
  memberId: number | null
  onUploadSuccess?: (attachment: Schemas['Attachment']) => void
  className?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
]

export function FileUploadDropzone({ memberId, onUploadSuccess, className }: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const api = useApi()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]!)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]!)
    }
  }

  const validateAndSetFile = (selectedFile: File) => {
    setError(null)
    
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('Kích thước tệp vượt quá 10MB.')
      return
    }
    
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Định dạng tệp không được hỗ trợ (chỉ nhận ảnh, pdf, docx, xlsx).')
      return
    }
    
    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) return
    setIsUploading(true)
    setError(null)

    try {
      // 1. Sign
      await api.post('/api/files/sign', {
        body: {
          kind: 'DOCUMENT',
          memberId,
          title: file.name,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        },
      })
      // Ở chế độ giả lập sẽ bị ném lỗi 503 tại đây
      
      // Nếu có backend thật, phần dưới này sẽ chạy
      toast({
        title: 'Thành công',
        description: 'Tải tệp lên thành công.',
      })
      
      // onUploadSuccess(...)
      setFile(null)
    } catch (err: any) {
      const msg = err.body?.detail || 'Lỗi khi tải tệp lên.'
      setError(msg)
      toast({
        variant: 'destructive',
        title: 'Không thể tải lên',
        description: msg,
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={cn('w-full', className)}>
      {!file ? (
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:bg-accent/50',
            'cursor-pointer'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="mb-2 h-10 w-10 text-muted-foreground" />
          <p className="mb-1 text-sm font-medium">
            Kéo thả tệp vào đây, hoặc click để chọn tệp
          </p>
          <p className="text-xs text-muted-foreground">
            Hỗ trợ PNG, JPG, WEBP, PDF, DOCX, XLSX (tối đa 10MB)
          </p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".png,.jpg,.jpeg,.webp,.pdf,.docx,.xlsx"
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-lg border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-accent">
              <FileIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium" title={file.name}>
                {file.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            {!isUploading && (
              <button
                type="button"
                className="ml-auto rounded-full p-1 hover:bg-accent"
                onClick={() => setFile(null)}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded bg-destructive/10 p-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            {!isUploading && (
              <button
                type="button"
                className="rounded px-3 py-1.5 text-sm font-medium hover:bg-accent"
                onClick={() => {
                  setFile(null)
                  setError(null)
                }}
              >
                Hủy
              </button>
            )}
            <button
              type="button"
              className="flex items-center gap-2 rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              disabled={isUploading}
              onClick={handleUpload}
            >
              {isUploading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Tải lên
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
