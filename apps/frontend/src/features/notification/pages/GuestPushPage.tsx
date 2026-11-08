import { Bell, BellOff, BellRing, Check, Smartphone } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { Alert } from '@/components/shared/Alert'
import { FormField } from '@/components/shared/FormField'
import { SectionCard } from '@/components/shared/SectionCard'
import { StickyActions } from '@/components/shared/StickyActions'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { isApproved } from '@/features/auth/routing'
import { useAuth } from '@/hooks/useAuth'
import type { GuestPushPref } from '@/types/api'
import { cn } from '@/utils/cn'
import { useGuestPushPref, useSaveGuestPushPref } from '../hooks'
import { disablePush, enablePush, getPushState, needsHomeScreenInstall, syncPush, type PushState } from '../push'
import { GUEST_REMIND_DAYS, guestPushStrings as s } from '../strings'

const HOUR_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

type Message = { kind: 'success' | 'danger'; text: string }

/**
 * Thông báo trên thiết bị này cho khách và tài khoản chưa duyệt (DECISIONS #89): bật/tắt push không cần đăng nhập
 * và tự chọn loại, mốc nhắc, giờ nhận. Tài khoản đã duyệt dùng trang Cài đặt thông báo.
 */
export function GuestPushPage() {
  const { user } = useAuth()
  if (isApproved(user)) return <Navigate to="/thong-bao/cai-dat" replace />
  return <GuestPushPanel />
}

function GuestPushPanel() {
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)
  const pref = useGuestPushPref(state === 'on')
  const save = useSaveGuestPushPref()

  const refresh = useCallback(() => void getPushState().then(setState), [])
  useEffect(() => {
    // Đồng bộ khóa với máy chủ rồi mới đọc trạng thái, để tùy chọn hiện ra đúng
    void syncPush('guest').then(refresh)
  }, [refresh])

  const run = async (action: () => Promise<string>) => {
    setBusy(true)
    setMessage(null)
    try {
      setMessage({ kind: 'success', text: await action() })
    } catch (e) {
      setMessage({ kind: 'danger', text: e instanceof Error ? e.message : s.enableFailed })
    } finally {
      setBusy(false)
      refresh()
    }
  }

  const homeScreen = needsHomeScreenInstall()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <SectionCard title={s.title} icon={Smartphone}>
        <div className="flex flex-col gap-4">
          <p className="-mt-1 text-text-muted">{s.intro}</p>

          <p className="font-semibold" aria-live="polite">
            {state ? s.status[state] : s.checking}
          </p>

          {state === 'unsupported' && (
            <Alert variant="info">{homeScreen ? s.iosInstall : s.unsupported}</Alert>
          )}
          {state === 'denied' && <Alert variant="info">{s.denied}</Alert>}
          {message && <Alert variant={message.kind}>{message.text}</Alert>}

          {state === 'off' && (
            <Button
              className="w-full sm:w-auto sm:self-start"
              loading={busy}
              onClick={() =>
                void run(async () => {
                  await enablePush('guest')
                  return s.enabled
                })
              }
            >
              <Bell aria-hidden="true" /> {s.enable}
            </Button>
          )}
          {state === 'on' && (
            <Button
              variant="outline"
              className="w-full sm:w-auto sm:self-start"
              loading={busy}
              onClick={() =>
                void run(async () => {
                  await disablePush('guest')
                  save.reset()
                  return s.disabled
                })
              }
            >
              <BellOff aria-hidden="true" /> {s.disable}
            </Button>
          )}
        </div>
      </SectionCard>

      {state === 'on' && pref.isSuccess && pref.data && (
        // key theo giá trị đã lưu: lưu xong thì form dựng lại với bản mới, không còn "chưa lưu"
        <PrefForm key={JSON.stringify(pref.data)} pref={pref.data} save={save} />
      )}
      {state === 'on' && pref.isSuccess && !pref.data && <Alert variant="info">{s.prefs.lost}</Alert>}
      {state === 'on' && pref.isError && <Alert variant="danger">{pref.error.message}</Alert>}
    </div>
  )
}

type SaveMutation = ReturnType<typeof useSaveGuestPushPref>

// `save` thuộc về trang (không phải form) để thông báo "Đã lưu" còn sau khi form dựng lại với giá trị mới
function PrefForm({ pref, save }: { pref: GuestPushPref; save: SaveMutation }) {
  const [memorials, setMemorials] = useState(pref.notifyMemorials)
  const [events, setEvents] = useState(pref.notifyEvents)
  const [days, setDays] = useState<number[]>(pref.remindDaysBefore)
  const [hour, setHour] = useState(pref.remindHour)

  const hourOk = HOUR_PATTERN.test(hour)
  const daysOk = days.length > 0
  const sameDays =
    days.length === pref.remindDaysBefore.length && days.every((d) => pref.remindDaysBefore.includes(d))
  const dirty =
    memorials !== pref.notifyMemorials || events !== pref.notifyEvents || hour !== pref.remindHour || !sameDays

  const toggleDay = (day: number) =>
    setDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]))

  const submit = () =>
    save.mutate({
      notifyEvents: events,
      notifyMemorials: memorials,
      remindDaysBefore: [...days].sort((a, b) => b - a),
      remindHour: hour,
    })

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <SectionCard title={s.prefs.title} icon={BellRing}>
        <div className="flex flex-col gap-4">
          <div>
            <Checkbox
              label={s.prefs.memorials}
              checked={memorials}
              onChange={(e) => setMemorials(e.target.checked)}
            />
            <Checkbox
              label={s.prefs.events}
              checked={events}
              onChange={(e) => setEvents(e.target.checked)}
            />
          </div>

          <div className="border-t border-border pt-4">
            <p id="guest-days-label" className="text-base font-medium">
              {s.prefs.daysTitle}
            </p>
            <p className="mb-2 text-sm text-text-muted">{s.prefs.daysHint}</p>
            <div role="group" aria-labelledby="guest-days-label" className="flex flex-wrap gap-2">
              {GUEST_REMIND_DAYS.map((day) => {
                const on = days.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleDay(day)}
                    className={cn(
                      'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-4 text-base font-medium transition-colors duration-200',
                      on
                        ? 'bg-primary text-primary-fg hover:bg-primary-hover'
                        : 'bg-secondary text-secondary-fg hover:bg-secondary-hover',
                    )}
                  >
                    {on && <Check className="size-4" aria-hidden="true" />}
                    {s.prefs.dayChip(day)}
                  </button>
                )
              })}
            </div>
            {!daysOk && (
              <p role="alert" className="mt-2 text-sm font-medium text-danger">
                {s.prefs.daysError}
              </p>
            )}
          </div>

          <FormField label={s.prefs.hourLabel} hint={s.prefs.hourHint}>
            <Input
              type="time"
              value={hour}
              className="sm:w-40"
              onChange={(e) => setHour(e.target.value)}
            />
          </FormField>

        </div>
      </SectionCard>

      {save.isError && <Alert variant="danger">{save.error.message || s.prefs.saveFailed}</Alert>}
      {save.isSuccess && !dirty && <Alert variant="success">{s.prefs.saved}</Alert>}

      <StickyActions>
        <Button type="submit" disabled={!dirty || !daysOk || !hourOk} loading={save.isPending}>
          {s.prefs.save}
        </Button>
      </StickyActions>
    </form>
  )
}
