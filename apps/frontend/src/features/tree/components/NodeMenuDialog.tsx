import {
  ArrowLeftRight,
  ArrowUp,
  Baby,
  ChevronsDownUp,
  ChevronsUpDown,
  Heart,
  HeartHandshake,
  Move,
  Network,
  RotateCcw,
  RotateCw,
  Trash2,
  UserMinus,
  UserPlus,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { ModalDialog } from '@/components/shared/ModalDialog'
import type { TreeNode } from '@/types/api'
import { cn } from '@/utils/cn'
import { getAddOptions, getSiblings, lineageIdOf, type TreeIndex } from '@/utils/tree'
import { useSetGender } from '../hooks'
import { nodeName, yearsText } from '../nodeText'
import { treeStrings } from '../strings'

const t = treeStrings.menu

export type MenuAction =
  | 'profile'
  | 'viewFrom'
  | 'kinship'
  | 'toggleCollapse'
  | 'rotate'
  | 'resetNode'
  | 'fill'
  | 'addChild'
  | 'addSpouse'
  | 'addParent'
  | 'move'
  | 'reorder'
  | 'pair'
  | 'remove'
  | 'delete'

type NodeMenuDialogProps = {
  open: boolean
  node: TreeNode | null
  index: TreeIndex
  generation: number | null
  isAdmin: boolean
  /** Nhánh của ô này đang thu gọn. */
  collapsed: boolean
  /** Ô này đang hiển thị dọc, và có cỡ/kiểu riêng đã chỉnh. */
  vertical: boolean
  customized: boolean
  onAction: (action: MenuAction) => void
  onClose: () => void
}

function Item({
  icon: Icon,
  danger,
  onClick,
  children,
}: {
  icon: LucideIcon
  danger?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-field px-3 text-left text-base font-medium transition-colors duration-200 ease-out hover:bg-surface-muted',
          danger && 'text-danger hover:bg-danger-bg',
        )}
      >
        <Icon className="size-5 shrink-0" aria-hidden="true" />
        {children}
      </button>
    </li>
  )
}

type Gender = 'M' | 'F' | null

/** Đặt nhanh giới tính (chỉ Admin, #100): ô đổi màu ngay khi cây tải lại. */
function GenderRow({ memberId, gender }: { memberId: number; gender: Gender }) {
  const setGender = useSetGender()
  const options: { value: Gender; label: string }[] = [
    { value: 'M', label: t.genderMale },
    { value: 'F', label: t.genderFemale },
    { value: null, label: t.genderUnknown },
  ]
  return (
    <div role="group" aria-label={t.gender} className="flex items-center gap-2 px-3 pb-1">
      <span className="shrink-0 text-base font-medium">{t.gender}</span>
      <div className="flex flex-1 gap-1 rounded-button bg-secondary p-1">
        {options.map((o) => (
          <button
            key={o.label}
            type="button"
            aria-pressed={gender === o.value}
            disabled={setGender.isPending}
            onClick={() => gender !== o.value && setGender.mutate({ memberId, gender: o.value })}
            className={cn(
              'min-h-9 min-w-11 flex-1 cursor-pointer rounded-button px-2 text-base font-semibold transition-colors duration-200 ease-out disabled:cursor-wait disabled:opacity-70',
              gender === o.value ? 'bg-primary text-primary-fg' : 'text-secondary-fg hover:bg-secondary-hover',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Menu khi bấm vào một ô (IDEA §8): mọi người thấy "Xem hồ sơ" và "Xem cây từ người này"; Admin thấy thêm các
 * thao tác dựng cây, chỉ ở chỗ được phép theo `utils/tree`. Dạng hộp thoại (bottom sheet trên điện thoại) nên
 * vùng bấm luôn đủ 44px dù sơ đồ đang thu nhỏ.
 */
export function NodeMenuDialog({ open, node, index, generation, isAdmin, collapsed, vertical, customized, onAction, onClose }: NodeMenuDialogProps) {
  if (!node) return <ModalDialog open={false} title="" onClose={onClose}>{null}</ModalDialog>

  const empty = node.memberId === null
  const isSpouse = index.ownerOf.has(node.id)
  const lineageId = lineageIdOf(index, node.id)
  const hasChildren = (index.childrenOf.get(lineageId)?.length ?? 0) > 0
  const add = getAddOptions(index, node.id)
  const siblings = getSiblings(index, node.id)
  const parentSpouses = node.parentNodeId === null ? 0 : (index.spousesOf.get(node.parentNodeId)?.length ?? 0)

  const run = (action: MenuAction) => () => onAction(action)
  const meta = [generation === null ? null : treeStrings.generation(generation), node.member ? yearsText(node.member) : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <ModalDialog open={open} title={nodeName(node)} onClose={onClose}>
      {meta && <p className="-mt-2 text-text-muted tabular-nums">{meta}</p>}

      <ul className="flex flex-col gap-1">
        {!empty && (
          <Item icon={UserRound} onClick={run('profile')}>
            {t.viewProfile}
          </Item>
        )}
        <Item icon={Network} onClick={run('viewFrom')}>
          {empty ? t.viewFromSlot : t.viewFrom}
        </Item>
        {!empty && (
          <Item icon={HeartHandshake} onClick={run('kinship')}>
            {t.kinship}
          </Item>
        )}
        <Item icon={RotateCw} onClick={run('rotate')}>
          {vertical ? t.rotateToHorizontal : t.rotateToVertical}
        </Item>
        {customized && (
          <Item icon={RotateCcw} onClick={run('resetNode')}>
            {t.resetNodeSize}
          </Item>
        )}
        {hasChildren && (
          <Item icon={collapsed ? ChevronsUpDown : ChevronsDownUp} onClick={run('toggleCollapse')}>
            {collapsed ? t.expand : t.collapse}
          </Item>
        )}
      </ul>

      {isAdmin && (
        <div className="flex flex-col gap-1 border-t border-border pt-3">
          <p className="px-3 text-sm font-medium text-text-muted">{t.adminGroup}</p>
          {node.member && node.memberId !== null && <GenderRow memberId={node.memberId} gender={node.member.gender} />}
          <ul className="flex flex-col gap-1">
            {empty && (
              <Item icon={UserPlus} onClick={run('fill')}>
                {t.fillSlot}
              </Item>
            )}
            <Item icon={Baby} onClick={run('addChild')}>
              {t.addChild}
            </Item>
            {add.spouse && (
              <Item icon={Heart} onClick={run('addSpouse')}>
                {t.addSpouse}
              </Item>
            )}
            {add.parent && (
              <Item icon={ArrowUp} onClick={run('addParent')}>
                {t.addParent}
              </Item>
            )}
            {!isSpouse && (
              <Item icon={Move} onClick={run('move')}>
                {t.move}
              </Item>
            )}
            {!isSpouse && siblings.length >= 2 && (
              <Item icon={ArrowLeftRight} onClick={run('reorder')}>
                {t.reorder}
              </Item>
            )}
            {!isSpouse && parentSpouses >= 2 && (
              <Item icon={Users} onClick={run('pair')}>
                {t.setPair}
              </Item>
            )}
            {!empty && (
              <Item icon={UserMinus} danger onClick={run('remove')}>
                {t.removeMember}
              </Item>
            )}
            {empty && (
              <Item icon={Trash2} danger onClick={run('delete')}>
                {t.deleteSlot}
              </Item>
            )}
          </ul>
        </div>
      )}
    </ModalDialog>
  )
}
