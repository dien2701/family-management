import { useState } from 'react'
import { FileDown, Calendar, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApi } from '@/services/api'
import { toast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'

export function ExportPage() {
  const api = useApi()
  const [loading, setLoading] = useState<string | null>(null)
  
  const currentYear = new Date().getFullYear()
  const [eventYear, setEventYear] = useState(currentYear)
  const [memorialYear, setMemorialYear] = useState(currentYear)

  const handleExport = async (type: string, url: string) => {
    setLoading(type)
    try {
      // Mock API sẽ luôn trả về 503
      const res = await api.get(url, { as: 'blob' })
      
      // Giả lập tải file nếu backend thật
      if (res) {
        const downloadUrl = window.URL.createObjectURL(res as Blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = url.split('/').pop()?.split('?')[0] || 'report'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Lỗi xuất dữ liệu',
        description: (err as Error).message || 'Cần kết nối máy chủ để xuất báo cáo.',
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-8 space-y-6">
      <h1 className="text-2xl font-bold">Xuất dữ liệu</h1>
      <p className="text-muted-foreground mb-6">
        Tải xuống các báo cáo về danh sách thành viên, sự kiện và lịch giỗ.
      </p>
      
      <div className="grid gap-4 md:grid-cols-2">
        {/* Danh sách thành viên */}
        <section className="rounded-card border border-border bg-surface p-4 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <FileDown className="h-5 w-5" />
            <h3>Hồ sơ thành viên</h3>
          </div>
          <p className="text-sm text-muted-foreground h-10">
            Xuất danh sách toàn bộ thành viên trong gia phả.
          </p>
          <div className="flex gap-2 pt-2">
            <Button 
              variant="secondary" 
              className="flex-1"
              disabled={loading !== null}
              onClick={() => handleExport('members-xlsx', '/api/reports/members.xlsx')}
            >
              {loading === 'members-xlsx' ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Excel
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1"
              disabled={loading !== null}
              onClick={() => handleExport('members-pdf', '/api/reports/members.pdf')}
            >
              {loading === 'members-pdf' ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              PDF
            </Button>
          </div>
        </section>

        {/* Sự kiện trong năm (Dương lịch) */}
        <section className="rounded-card border border-border bg-surface p-4 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5" />
            <h3>Sự kiện (Dương lịch)</h3>
          </div>
          <div className="flex items-center gap-2 h-10">
            <span className="text-sm">Năm:</span>
            <Input 
              type="number" 
              value={eventYear} 
              onChange={(e) => setEventYear(Number(e.target.value))}
              className="w-24 h-8 text-sm" 
            />
          </div>
          <div className="pt-2">
            <Button 
              variant="secondary" 
              className="w-full"
              disabled={loading !== null}
              onClick={() => handleExport('events-xlsx', `/api/reports/events.xlsx?year=${eventYear}`)}
            >
              {loading === 'events-xlsx' ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Tải Excel
            </Button>
          </div>
        </section>

        {/* Lịch giỗ (Âm lịch) */}
        <section className="rounded-card border border-border bg-surface p-4 shadow-card space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5" />
            <h3>Lịch giỗ (Âm lịch)</h3>
          </div>
          <div className="flex items-center gap-2 h-10">
            <span className="text-sm">Năm:</span>
            <Input 
              type="number" 
              value={memorialYear} 
              onChange={(e) => setMemorialYear(Number(e.target.value))}
              className="w-24 h-8 text-sm" 
            />
          </div>
          <div className="pt-2">
            <Button 
              variant="secondary" 
              className="w-full"
              disabled={loading !== null}
              onClick={() => handleExport('memorials-pdf', `/api/reports/memorials.pdf?lunarYear=${memorialYear}`)}
            >
              {loading === 'memorials-pdf' ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Tải PDF
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
