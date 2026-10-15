import { useState, type FormEvent } from 'react'
import { FormField } from '@/components/shared/FormField'
import { ModalDialog } from '@/components/shared/ModalDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AiConversation } from '@/types/api'
import { ApiError } from '@/services/client'
import { useUpdateConversation } from '../hooks'
import { aiStrings } from '../strings'

const MAX_TITLE = 60

type Props = { conversation: AiConversation | null; onClose: () => void }

export function RenameConversationDialog({ conversation, onClose }: Props) {
  return (
    <ModalDialog
      open={conversation !== null}
      title={aiStrings.conversations.renameTitle}
      onClose={onClose}
    >
      {/* Dựng khi mở nên ô nhập luôn bắt đầu từ tên hiện tại */}
      {conversation && <RenameForm conversation={conversation} onClose={onClose} />}
    </ModalDialog>
  )
}

function RenameForm({ conversation, onClose }: { conversation: AiConversation; onClose: () => void }) {
  const update = useUpdateConversation()
  const [title, setTitle] = useState(conversation.title)
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = title.trim()
    if (!value) return setError(aiStrings.conversations.renameRequired)
    if (value.length > MAX_TITLE) return setError(aiStrings.conversations.renameTooLong)
    setError(null)
    update.mutate(
      { id: conversation.id, title: value },
      {
        onSuccess: onClose,
        onError: (e) =>
          setError(e instanceof ApiError ? e.message : aiStrings.conversations.actionError),
      },
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <FormField label={aiStrings.conversations.renameLabel} error={error ?? undefined}>
        <Input
          value={title}
          maxLength={MAX_TITLE}
          autoFocus
          onChange={(event) => setTitle(event.target.value)}
        />
      </FormField>
      <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
        <Button type="button" variant="secondary" disabled={update.isPending} onClick={onClose}>
          {aiStrings.conversations.cancel}
        </Button>
        <Button type="submit" loading={update.isPending}>
          {aiStrings.conversations.save}
        </Button>
      </div>
    </form>
  )
}
