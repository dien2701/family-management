import { ArrowDownUp, ChevronRight, Minus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Alert } from '@/components/shared/Alert'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { ModalDialog } from '@/components/shared/ModalDialog'
import { Button } from '@/components/ui/button'
import { kinshipBetween, type TreeIndex } from '@/utils/tree'
import { nodeName } from '../nodeText'
import { treeStrings } from '../strings'
import { PersonSelect } from './PersonSelect'

const s = treeStrings.kinship

type KinshipDialogProps = {
  open: boolean
  index: TreeIndex
  generations: ReadonlyMap<number, number>
  /** Mở sẵn: người thứ nhất là ô đang chọn trên cây (không có thì "Tôi"), người thứ hai là "Tôi" (nếu đã liên kết). */
  initialA: number | null
  initialB: number | null
  onClose: () => void
}

/** Hộp "Xưng hô" (#100): chọn hai người, xem họ gọi nhau thế nào. Tính ở máy người dùng nên khách cũng dùng được (#88). */
export function KinshipDialog({ open, index, generations, initialA, initialB, onClose }: KinshipDialogProps) {
  const [a, setA] = useState(initialA)
  const [b, setB] = useState(initialB)
  const result = useMemo(
    () => (a === null || b === null ? undefined : kinshipBetween(index, generations, a, b)),
    [a, b, index, generations],
  )
  const name = (id: number) => {
    const node = index.nodes.get(id)
    return node ? nodeName(node) : ''
  }
  const isCouple = (x: number, y: number) => index.ownerOf.get(x) === y || index.ownerOf.get(y) === x
  // Ảnh đại diện nhỏ + tên đậm vừa, dùng trong hai dòng xưng hô
  const person = (id: number) => {
    const member = index.nodes.get(id)?.member
    return (
      <span className="inline-flex min-w-0 items-center gap-2">
        {member && <UserAvatar url={member.avatarUrl} name={member.fullName} className="size-8 shrink-0 text-sm" />}
        <span className="font-semibold text-text [overflow-wrap:anywhere]">{name(id)}</span>
      </span>
    )
  }
  return (
    <ModalDialog open={open} title={s.title} wide onClose={onClose}>
      {/* Điện thoại: hai ô xếp chồng; ≥768px: hai ô cạnh nhau như mẫu, nút hoán đổi ở giữa */}
      <div className="flex flex-col gap-1 md:grid md:grid-cols-[1fr_auto_1fr] md:items-end md:gap-2">
        <PersonSelect index={index} generations={generations} label={s.first} selectedId={a} excludeId={b} onPick={setA} />
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label={s.swap}
            title={s.swap}
            disabled={a === null && b === null}
            onClick={() => {
              setA(b)
              setB(a)
            }}
          >
            <ArrowDownUp className="md:rotate-90" />
          </Button>
        </div>
        <PersonSelect index={index} generations={generations} label={s.second} selectedId={b} excludeId={a} onPick={setB} />
      </div>

      <div aria-live="polite" className="flex flex-col gap-3">
        {a === null || b === null || result === undefined ? null : result === null ? (
          <Alert variant="info">{s.notFound}</Alert>
        ) : (
          <>
            <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-fg">{result.group}</span>
                <span className="text-sm text-text-muted">
                  {s.generation((generations.get(b) ?? 0) - (generations.get(a) ?? 0))}
                </span>
              </div>
              {/* Khóa theo chiều (ab/ba), không theo id: id trùng nhau thì React giữ lại dòng cũ */}
              {[
                { key: 'ab', from: a, to: b, term: result.aCallsB },
                { key: 'ba', from: b, to: a, term: result.bCallsA },
              ].map((row) => (
                <p key={row.key} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {person(row.from)}
                  <span className="text-text-muted">{s.callsWord}</span>
                  {person(row.to)}
                  <span className="text-text-muted">{s.isWord}</span>
                  <span className="font-semibold text-primary [overflow-wrap:anywhere]">“{row.term}”</span>
                </p>
              ))}
            </div>
            {result.needsGender && <Alert variant="info">{s.needsGender}</Alert>}
            {result.path.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <p className="font-medium">{s.pathTitle}</p>
                <ol className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
                  {result.path.map((id, i) => (
                    <li key={id} className="flex items-center gap-1">
                      {i > 0 &&
                        // Hai người liền nhau là vợ chồng thì nối bằng gạch ngang, còn lại là mũi tên cha mẹ–con
                        (isCouple(result.path[i - 1] as number, id) ? (
                          <Minus className="size-4 shrink-0 text-text-muted" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="size-4 shrink-0 text-text-muted" aria-hidden="true" />
                        ))}
                      <span className="rounded-full bg-secondary px-3 py-1 text-secondary-fg [overflow-wrap:anywhere]">
                        {name(id)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </div>
    </ModalDialog>
  )
}
