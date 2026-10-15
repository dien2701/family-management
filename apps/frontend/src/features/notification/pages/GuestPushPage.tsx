import { Bell, BellOff, Check, Smartphone } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { Alert } from '@/components/shared/Alert'
import { FormField } from '@/components/shared/FormField'
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

const CARD = 'flex flex-col gap-4 rounded-card border border-border bg-surface p-4 shadow-card md:p-6'
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
      <section aria-labelledby="guest-push-title" className={CARD}>
        <div>
          <h2 id="guest-push-title" className="flex items-center gap-2 text-lg font-semibold">
            <Smartphone className="size-5" aria-hidden="true" /> {s.title}
          </h2>
          <p className="mt-1 text-text-muted">{s.intro}</p>
        </div>

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
      </section>

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
      aria-labelledby="guest-pref-title"
      className={CARD}
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <h2 id="guest-pref-title" className="text-lg font-semibold">
        {s.prefs.title}
      </h2>

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

      {save.isError && <Alert variant="danger">{save.error.message || s.prefs.saveFailed}</Alert>}
      {save.isSuccess && !dirty && <Alert variant="success">{s.prefs.saved}</Alert>}

      <Button
        type="submit"
        className="w-full sm:w-auto sm:self-end"
        disabled={!dirty || !daysOk || !hourOk}
        loading={save.isPending}
      >
        {s.prefs.save}
      </Button>
    </form>
  )
}
