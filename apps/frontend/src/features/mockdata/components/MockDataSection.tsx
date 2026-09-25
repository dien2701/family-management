import { useQueryClient } from '@tanstack/react-query'
import { Download, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/shared/Alert'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { exportStoreJson, resetStore } from '@/services/mock'
import { mockDataStrings as s } from '../strings'

function downloadJson(json: string) {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `giapha-du-lieu-tam-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

// Chỉ được nạp ở chế độ giả lập (MorePage import động dưới điều kiện VITE_API_MODE=mock)
export default function MockDataSection() {
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleDownload = () => {
    downloadJson(exportStoreJson())
    setMessage(s.downloaded)
  }

  const handleReset = async () => {
    const store = resetStore()
    setConfirming(false)
    setMessage(s.resetDone(store.members.length))
    // Dữ liệu trong bộ nhớ đệm của các màn hình đã cũ
    await queryClient.invalidateQueries()
  }

  return (
    <section
      aria-labelledby="mock-data-title"
      className="mt-4 flex flex-col gap-4 rounded-card border border-border bg-surface p-4 shadow-card md:p-6"
    >
      <h2 id="mock-data-title" className="text-lg leading-tight font-semibold">
        {s.title}
      </h2>
      <Alert variant="info">{s.banner}</Alert>
      <div className="flex flex-col gap-2 md:flex-row">
        <Button variant="secondary" onClick={handleDownload}>
          <Download aria-hidden="true" />
          {s.download}
        </Button>
        <Button variant="secondary" onClick={() => setConfirming(true)}>
          <RotateCcw aria-hidden="true" />
          {s.reset}
        </Button>
      </div>
      {message && (
        <p role="status" className="font-medium text-success">
          {message}
        </p>
      )}
      <ConfirmDialog
        open={confirming}
        danger
        title={s.confirmTitle}
        description={s.confirmBody}
        confirmLabel={s.confirmAction}
        cancelLabel={s.cancel}
        onConfirm={handleReset}
        onCancel={() => setConfirming(false)}
      />
    </section>
  )
}
