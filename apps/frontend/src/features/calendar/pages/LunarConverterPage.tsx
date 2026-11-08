import { ArrowLeftRight, CalendarCheck } from 'lucide-react'
import { useState } from 'react'
import { SectionCard } from '@/components/shared/SectionCard'
import { DualDateInput } from '@/components/ui/DualDateInput'
import { Button } from '@/components/ui/button'
import { solarToDualDate, todayInVietnam } from '@/utils/lunar'
import { calendarStrings as s } from '../strings'

// Đổi lịch chạy hoàn toàn ở máy (bản TS của thuật toán, đã đối chiếu fixture chung với backend), không gọi API
export function LunarConverterPage() {
  const [value, setValue] = useState(() => solarToDualDate(todayInVietnam()))

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <SectionCard title={s.converter.title} icon={ArrowLeftRight}>
        <div className="flex flex-col gap-4">
          <p className="text-base text-text-muted">{s.converter.description}</p>
          <DualDateInput
            label={s.converter.field}
            value={value}
            onChange={setValue}
            hint={s.converter.range}
          />
          <Button
            variant="secondary"
            className="self-start"
            onClick={() => setValue(solarToDualDate(todayInVietnam()))}
          >
            <CalendarCheck aria-hidden="true" />
            {s.converter.today}
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}
