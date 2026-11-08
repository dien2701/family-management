import { useId } from 'react'
import { Button } from '@/components/ui/button'
import type { AccountAdmin } from '@/types/api'
import { actionsFor, canDelete, linkActionFor } from '../accountRules'
import type { AccountAction, LinkAction } from '../api'
import { accountActionText, adminStrings } from '../strings'

type AccountActionsProps = {
  account: AccountAdmin
  selfId: number | undefined
  onAction: (account: AccountAdmin, action: AccountAction) => void
  onLinkAction: (account: AccountAdmin, action: LinkAction) => void
}

const PRIMARY: AccountAction[] = ['restore', 'approve', 'unlock']
const DANGER: AccountAction[] = ['reject', 'lock']
const dangerClass = 'border-danger/40 text-danger hover:bg-danger-bg'

/**
 * Nút trong hộp chi tiết tài khoản, 3 tầng cho đỡ rối (ui-ux-pro-max: một nút chính, nút nguy hiểm tách riêng):
 * 1. Nút chính rộng hết hộp: Khôi phục / Duyệt / Mở khóa (nếu có).
 * 2. Nút phụ viền, lưới 2 cột: Cấp/Gỡ Admin, Gán/Hủy liên kết.
 * 3. Sau đường kẻ, "vùng nguy hiểm" chữ đỏ: Từ chối hoặc Khóa, và Xóa tài khoản. Admin thấy Xóa bị mờ kèm lời nhắc gỡ
 *    quyền trước (DECISIONS #97). Bấm nút nào cũng chỉ mở hộp xác nhận.
 */
export function AccountActions({ account, selfId, onAction, onLinkAction }: AccountActionsProps) {
  const hintId = useId()
  const isSelf = account.id !== undefined && account.id === selfId
  const actions = actionsFor(account, selfId)
  const linkAction = linkActionFor(account, selfId)
  const primary = actions.filter((a) => PRIMARY.includes(a))
  const secondary = actions.filter((a) => !PRIMARY.includes(a) && !DANGER.includes(a))
  const danger = actions.filter((a) => DANGER.includes(a))
  const deletable = canDelete(account, selfId)
  // Chính mình hoặc tài khoản đã xóa thì không có nút Xóa; Admin thì có nhưng mờ
  const showDelete = !isSelf && !account.deletedAt
  const name = account.fullName ?? ''

  const label = (action: AccountAction) => `${accountActionText[action].label} ${name}`.trim()
  const secondaryCount = secondary.length + (linkAction ? 1 : 0)

  if (primary.length + secondaryCount + danger.length === 0 && !showDelete) return null

  return (
    <div className="flex flex-col gap-3">
      {primary.map((action) => (
        <Button key={action} aria-label={label(action)} onClick={() => onAction(account, action)}>
          {accountActionText[action].label}
        </Button>
      ))}

      {secondaryCount > 0 && (
        <div className={secondaryCount > 1 ? 'grid grid-cols-2 gap-2' : 'grid'}>
          {secondary.map((action) => (
            <Button key={action} variant="outline" aria-label={label(action)} onClick={() => onAction(account, action)}>
              {accountActionText[action].label}
            </Button>
          ))}
          {linkAction && (
            <Button
              variant="outline"
              aria-label={linkAction === 'link' ? adminStrings.link.assignFor(name) : adminStrings.link.unassignFor(name)}
              onClick={() => onLinkAction(account, linkAction)}
            >
              {linkAction === 'link' ? adminStrings.link.assign : adminStrings.link.unassign}
            </Button>
          )}
        </div>
      )}

      {(danger.length > 0 || showDelete) && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <div className={danger.length > 0 && showDelete ? 'grid grid-cols-2 gap-2' : 'grid'}>
            {danger.map((action) => (
              <Button
                key={action}
                variant="outline"
                className={dangerClass}
                aria-label={label(action)}
                onClick={() => onAction(account, action)}
              >
                {accountActionText[action].label}
              </Button>
            ))}
            {showDelete && (
              <Button
                variant="outline"
                className={dangerClass}
                disabled={!deletable}
                aria-label={label('delete')}
                aria-describedby={deletable ? undefined : hintId}
                onClick={() => onAction(account, 'delete')}
              >
                {accountActionText.delete.label}
              </Button>
            )}
          </div>
          {showDelete && !deletable && (
            <p id={hintId} className="text-sm text-text-muted">
              {adminStrings.accounts.deleteAdminHint}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
