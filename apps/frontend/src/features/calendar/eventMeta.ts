import { CalendarHeart, Cake, Flame, type LucideIcon } from 'lucide-react'
import type { EventType } from '@/types/api'
import { calendarStrings } from './strings'

type EventTypeMeta = {
  label: string
  icon: LucideIcon
  /** Màu chữ/icon, nền nhạt và nền chấm theo token của DESIGN §1. */
  text: string
  soft: string
  dot: string
}

// Class viết nguyên chữ để Tailwind quét được. Luôn dùng kèm icon hoặc nhãn, không phân biệt bằng màu đơn thuần.
export const EVENT_TYPE_META: Record<EventType, EventTypeMeta> = {
  MEMORIAL: {
    label: calendarStrings.types.MEMORIAL,
    icon: Flame,
    text: 'text-event-memorial',
    soft: 'bg-event-memorial/10',
    dot: 'bg-event-memorial',
  },
  BIRTHDAY: {
    label: calendarStrings.types.BIRTHDAY,
    icon: Cake,
    text: 'text-accent-text',
    soft: 'bg-event-birthday/10',
    dot: 'bg-event-birthday',
  },
  CUSTOM: {
    label: calendarStrings.types.CUSTOM,
    icon: CalendarHeart,
    text: 'text-event-custom',
    soft: 'bg-event-custom/10',
    dot: 'bg-event-custom',
  },
}

export const EVENT_TYPES: readonly EventType[] = ['MEMORIAL', 'BIRTHDAY', 'CUSTOM']
