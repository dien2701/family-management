import { ArrowDownUp, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Alert } from '@/components/shared/Alert'
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
  return (
    <ModalDialog open={open} title={s.title} wide onClose={onClose}>
      {/* Điện thoại: hai ô xếp chồng; ≥768px: hai ô cạnh nhau như mẫu, nút hoán đổi ở giữa */}
      <div className="flex flex-col gap-1 md:grid md:grid-cols-[1fr_auto_1fr] md:items-end md:gap-2">
        <PersonSelect index={index} generations={generations} label={s.first} selectedId={a} onPick={setA} />
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
        <PersonSelect index={index} generations={generations} label={s.second} selectedId={b} onPick={setB} />
      </div>

      <div aria-live="polite" className="flex flex-col gap-3">
        {a === null || b === null || result === undefined ? (
          <p className="text-text-muted">{s.pickBoth}</p>
        ) : result === null ? (
          <Alert variant="info">{s.notFound}</Alert>
        ) : (
          <>
            {[
              { from: a, to: b, term: result.aCallsB },
              { from: b, to: a, term: result.bCallsA },
            ].map((row) => (
              <div key={`${row.from}-${row.to}`} className="rounded-field bg-surface-muted px-4 py-3">
                <p className="text-text-muted [overflow-wrap:anywhere]">{s.calls(name(row.from), name(row.to))}</p>
                <p className="text-xl font-bold text-primary [overflow-wrap:anywhere]">{row.term}</p>
              </div>
            ))}
            {result.needsGender && <Alert variant="info">{s.needsGender}</Alert>}
            {result.path.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <p className="font-medium">{s.pathTitle}</p>
                <ol className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
                  {result.path.map((id, i) => (
                    <li key={id} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight className="size-4 shrink-0 text-text-muted" aria-hidden="true" />}
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
