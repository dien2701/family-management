import { Ellipsis, HeartHandshake, Plus, Printer, RectangleHorizontal, RectangleVertical, RotateCcw, Search, UserRound } from 'lucide-react'
import { useState } from 'react'
import { ListGroup, ListRow } from '@/components/shared/ListRow'
import { ModalDialog } from '@/components/shared/ModalDialog'
import type { TreeIndex } from '@/utils/tree'
import type { TreeViewPrefs } from '../nodeSize'
import { treeStrings } from '../strings'
import { MemberPicker } from './MemberPicker'
import { ToolButton } from './TreeCanvas'
import { SizeGroup } from './TreeToolbar'

const s = treeStrings.toolbar

type PhoneSearchProps = {
  index: TreeIndex
  generations: ReadonlyMap<number, number>
  onPick: (nodeId: number) => void
}

/** Điện thoại: nút kính lúp đầu thanh công cụ góc dưới trái, mở hộp "Tìm trên cây" (thay ô tìm phía trên sơ đồ). */
export function PhoneSearchTool({ index, generations, onPick }: PhoneSearchProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <ToolButton label={s.search} onClick={() => setOpen(true)}>
        <Search aria-hidden="true" />
      </ToolButton>
      <ModalDialog open={open} title={s.search} onClose={() => setOpen(false)}>
        <MemberPicker
          index={index}
          generations={generations}
          label={s.search}
          placeholder={s.searchPlaceholder}
          resultsLabel={s.searchResults}
          noMatch={s.searchNoMatch}
          floating={false}
          onPick={(nodeId) => {
            setOpen(false)
            onPick(nodeId)
          }}
        />
      </ModalDialog>
    </>
  )
}

type PhoneMoreProps = {
  isAdmin: boolean
  prefs: TreeViewPrefs
  onPrefsChange: (change: Partial<TreeViewPrefs>) => void
  hasNodeOverrides: boolean
  onResetNodes: () => void
  onAddRoot: () => void
  onMyAncestors: () => void
  onKinship: () => void
  onPrint: () => void
}

/** Điện thoại: nút "Xem cây" và "..." cuối thanh công cụ góc dưới trái; các thao tác còn lại nằm trong bảng "...". */
export function PhoneMoreTools({
  isAdmin,
  prefs,
  onPrefsChange,
  hasNodeOverrides,
  onResetNodes,
  onAddRoot,
  onMyAncestors,
  onKinship,
  onPrint,
}: PhoneMoreProps) {
  const [open, setOpen] = useState(false)
  const run = (action: () => void) => () => {
    setOpen(false)
    action()
  }

  return (
    <>
      <ToolButton label={s.print} onClick={onPrint}>
        <Printer aria-hidden="true" />
      </ToolButton>
      <ToolButton label={s.moreTools} onClick={() => setOpen(true)}>
        <Ellipsis aria-hidden="true" />
      </ToolButton>

      <ModalDialog open={open} title={s.moreTools} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-1.5">
          <p className="text-base font-medium">{s.sizeGroup}</p>
          <SizeGroup size={prefs.size} onChange={(size) => onPrefsChange({ size })} />
        </div>
        <ListGroup>
          <ListRow icon={HeartHandshake} label={s.kinship} onClick={run(onKinship)} />
          <ListRow icon={UserRound} label={s.myAncestors} onClick={run(onMyAncestors)} />
          <ListRow
            icon={prefs.vertical ? RectangleHorizontal : RectangleVertical}
            label={prefs.vertical ? s.horizontalView : s.verticalView}
            onClick={run(() => onPrefsChange({ vertical: !prefs.vertical }))}
          />
          {isAdmin && <ListRow icon={Plus} label={s.addRoot} onClick={run(onAddRoot)} />}
          {hasNodeOverrides && <ListRow icon={RotateCcw} label={s.resetNodes} onClick={run(onResetNodes)} />}
        </ListGroup>
      </ModalDialog>
    </>
  )
}
