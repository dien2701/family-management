import { useState } from 'react'
import { FileDown, Calendar, Download, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApi } from '@/services/api'
import { toast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/FormField'
import { SectionCard } from '@/components/shared/SectionCard'

export function ExportPage() {
  const api = useApi()
  const [loading, setLoading] = useState<string | null>(null)
  
  const currentYear = new Date().getFullYear()
  const [eventYear, setEventYear] = useState(currentYear)
  const [memorialYear, setMemorialYear] = useState(currentYear)

  const handleExport = async (type: string, url: string) => {
    setLoading(type)
    try {
      const { blob, filename } = await api.download(url)
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      // Tên tệp có ngày xuất do máy chủ đặt; thiếu header thì lấy theo đường dẫn
      link.download = filename ?? (url.split('/').pop()?.split('?')[0] || 'report')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Lỗi xuất dữ liệu',
        description: (err as Error).message || 'Không xuất được báo cáo, vui lòng thử lại.',
      })
    } finally {
      setLoading(null)
    }
  }

  // Nút tải: hiện vòng xoay ở đúng nút đang tải, khóa các nút khác
  const exportButton = (type: string, url: string, label: string) => (
    <Button
      variant="secondary"
      className="flex-1"
      loading={loading === type}
      disabled={loading !== null}
      onClick={() => void handleExport(type, url)}
    >
      {loading !== type && <Download aria-hidden="true" />}
      {label}
    </Button>
  )

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-bold">Xuất dữ liệu</h1>
      <p className="text-text-muted">Tải xuống các báo cáo về danh sách thành viên, sự kiện và lịch giỗ.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Hồ sơ thành viên" icon={FileDown}>
          <div className="flex flex-col gap-4">
            <p className="text-text-muted">Xuất danh sách toàn bộ thành viên trong gia phả.</p>
            <div className="flex gap-2">
              {exportButton('members-xlsx', '/api/reports/members.xlsx', 'Excel')}
              {exportButton('members-pdf', '/api/reports/members.pdf', 'PDF')}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Sự kiện (Dương lịch)" icon={Calendar}>
          <div className="flex flex-col gap-4">
            <FormField label="Năm">
              <Input
                type="number"
                inputMode="numeric"
                value={eventYear}
                onChange={(e) => setEventYear(Number(e.target.value))}
                className="sm:w-32"
              />
            </FormField>
            <div className="flex">
              {exportButton('events-xlsx', `/api/reports/events.xlsx?year=${eventYear}`, 'Tải Excel')}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Lịch giỗ (Âm lịch)" icon={Moon}>
          <div className="flex flex-col gap-4">
            <FormField label="Năm âm lịch">
              <Input
                type="number"
                inputMode="numeric"
                value={memorialYear}
                onChange={(e) => setMemorialYear(Number(e.target.value))}
                className="sm:w-32"
              />
            </FormField>
            <div className="flex">
              {exportButton('memorials-pdf', `/api/reports/memorials.pdf?lunarYear=${memorialYear}`, 'Tải PDF')}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
