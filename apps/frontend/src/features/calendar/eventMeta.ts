import type { EventType } from '@/types/api'
import { calendarStrings } from './strings'

type EventTypeMeta = {
  label: string
  /** Nền chấm màu theo token của DESIGN §1. */
  dot: string
}

// Class viết nguyên chữ để Tailwind quét được. Chấm màu luôn đi kèm chữ, không phân biệt bằng màu đơn thuần.
export const EVENT_TYPE_META: Record<EventType, EventTypeMeta> = {
  MEMORIAL: { label: calendarStrings.types.MEMORIAL, dot: 'bg-event-memorial' },
  BIRTHDAY: { label: calendarStrings.types.BIRTHDAY, dot: 'bg-event-birthday' },
  CUSTOM: { label: calendarStrings.types.CUSTOM, dot: 'bg-event-custom' },
}

export const EVENT_TYPES: readonly EventType[] = ['MEMORIAL', 'BIRTHDAY', 'CUSTOM']
