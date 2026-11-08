import { Ellipsis, Plus, Printer, RectangleHorizontal, RectangleVertical, RotateCcw, UserRound } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ListGroup, ListRow } from '@/components/shared/ListRow'
import { ModalDialog } from '@/components/shared/ModalDialog'
import { cn } from '@/utils/cn'
import type { TreeViewPrefs } from '../nodeSize'
import { treeStrings } from '../strings'
import { SizeGroup } from './TreeToolbar'

const s = treeStrings.toolbar

type TreePhoneToolsProps = {
  isAdmin: boolean
  prefs: TreeViewPrefs
  onPrefsChange: (change: Partial<TreeViewPrefs>) => void
  hasNodeOverrides: boolean
  onResetNodes: () => void
  onAddRoot: () => void
  onMyAncestors: () => void
  onPrint: () => void
}

function RoundButton({
  label,
  primary,
  onClick,
  children,
}: {
  label: string
  primary?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'flex size-11 cursor-pointer items-center justify-center rounded-full shadow-card transition-colors duration-200 ease-out [&_svg]:size-5',
        primary
          ? 'bg-primary text-primary-fg hover:bg-primary-hover'
          : 'border border-border bg-surface text-primary hover:bg-surface-muted',
      )}
    >
      {children}
    </button>
  )
}

/** Điện thoại: cột nút tròn 44px nổi ở góc trên phải sơ đồ; các tùy chọn ít dùng nằm trong bảng "Tùy chọn hiển thị". */
export function TreePhoneTools({
  isAdmin,
  prefs,
  onPrefsChange,
  hasNodeOverrides,
  onResetNodes,
  onAddRoot,
  onMyAncestors,
  onPrint,
}: TreePhoneToolsProps) {
  const [open, setOpen] = useState(false)
  const run = (action: () => void) => () => {
    setOpen(false)
    action()
  }

  return (
    <>
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 md:hidden">
        <RoundButton label={s.myAncestors} onClick={onMyAncestors}>
          <UserRound aria-hidden="true" />
        </RoundButton>
        <RoundButton
          label={prefs.vertical ? s.horizontalView : s.verticalView}
          onClick={() => onPrefsChange({ vertical: !prefs.vertical })}
        >
          {prefs.vertical ? <RectangleHorizontal aria-hidden="true" /> : <RectangleVertical aria-hidden="true" />}
        </RoundButton>
        {isAdmin && (
          <RoundButton label={s.addRoot} primary onClick={onAddRoot}>
            <Plus aria-hidden="true" />
          </RoundButton>
        )}
        <RoundButton label={s.moreTools} onClick={() => setOpen(true)}>
          <Ellipsis aria-hidden="true" />
        </RoundButton>
      </div>

      <ModalDialog open={open} title={s.moreTools} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-1.5">
          <p className="text-base font-medium">{s.sizeGroup}</p>
          <SizeGroup size={prefs.size} onChange={(size) => onPrefsChange({ size })} />
        </div>
        <ListGroup>
          <ListRow icon={Printer} label={s.print} onClick={run(onPrint)} />
          {hasNodeOverrides && <ListRow icon={RotateCcw} label={s.resetNodes} onClick={run(onResetNodes)} />}
        </ListGroup>
      </ModalDialog>
    </>
  )
}
