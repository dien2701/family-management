import { useState } from 'react'
import { MemberPickerDialog } from '@/components/shared/MemberPickerDialog'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useMemberSearch } from '@/hooks/useMemberSearch'
import { ApiError } from '@/services/client'
import type { AccountAdmin, MemberSummary } from '@/types/api'
import { useLinkMember } from '../hooks'
import { accountErrorText, adminStrings as s } from '../strings'

type AssignMemberDialogProps = {
  /** Tài khoản đang được gán; `null` là đóng. Nơi dùng đặt `key` mới mỗi lần mở để hộp về ban đầu. */
  account: AccountAdmin | null
  onClose: () => void
}

/**
 * "Gán thành viên" (DECISIONS #80): Admin chọn thành viên cho một tài khoản đã duyệt, không cần yêu cầu.
 * Hộp chọn tìm trong mọi thành viên; người đã có tài khoản khác bị máy chủ báo 409 `MEMBER_ALREADY_LINKED`.
 */
export function AssignMemberDialog({ account, onClose }: AssignMemberDialogProps) {
  const open = account !== null
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<MemberSummary | null>(null)
  const search = useMemberSearch(useDebouncedValue(query), open)
  const link = useLinkMember()

  const submit = () => {
    if (!account?.id || !selected) return
    link.mutate({ accountId: account.id, memberId: selected.id }, { onSuccess: onClose })
  }

  const error = link.isError
    ? link.error instanceof ApiError
      ? (link.error.code && accountErrorText[link.error.code]) || link.error.message
      : 'Có lỗi xảy ra, vui lòng thử lại.'
    : null

  return (
    <MemberPickerDialog
      open={open}
      title={s.link.pickerTitle(account?.fullName ?? '')}
      description={s.link.pickerDescription}
      confirmLabel={s.link.pickerConfirm}
      labels={s.picker}
      query={query}
      onQueryChange={setQuery}
      members={search.data?.items ?? []}
      totalCount={search.data?.totalElements}
      loading={search.isFetching}
      loadFailed={search.isError}
      onRetry={() => void search.refetch()}
      selected={selected}
      onSelect={(member) => {
        setSelected(member)
        link.reset()
      }}
      error={error}
      submitting={link.isPending}
      onConfirm={submit}
      onCancel={() => {
        if (!link.isPending) onClose()
      }}
    />
  )
}
