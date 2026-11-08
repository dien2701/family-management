import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AiConversationUpdate } from '@/types/api'
import { aiApi } from './api'

export const AI_QUOTA_KEY = ['ai', 'quota'] as const
export const AI_CONVERSATIONS_KEY = ['ai', 'conversations'] as const

export function useAiQuota() {
  return useQuery({ queryKey: AI_QUOTA_KEY, queryFn: aiApi.quota })
}

/** Danh sách đoạn chat (ghim trước, rồi mới hoạt động nhất); `q` rỗng là lấy tất cả. */
export function useAiConversations(q: string, enabled = true) {
  return useQuery({
    queryKey: [...AI_CONVERSATIONS_KEY, q],
    queryFn: () => aiApi.conversations(q),
    enabled,
  })
}

export function useUpdateConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    meta: {
      successMessage: (_d, v) => {
        const { pinned } = v as AiConversationUpdate
        if (pinned === undefined) return 'Đã đổi tên đoạn chat.'
        return pinned ? 'Đã ghim đoạn chat.' : 'Đã bỏ ghim đoạn chat.'
      },
    },
    mutationFn: ({ id, ...body }: AiConversationUpdate & { id: number }) =>
      aiApi.updateConversation(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AI_CONVERSATIONS_KEY }),
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    meta: { successMessage: 'Đã xóa đoạn chat.' },
    mutationFn: aiApi.deleteConversation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AI_CONVERSATIONS_KEY }),
  })
}

export function useDraftAction(kind: 'submit' | 'apply') {
  return useMutation({
    meta: { successMessage: kind === 'submit' ? 'Đã gửi đề xuất.' : 'Đã áp dụng bản nháp.' },
    mutationFn: (id: number) => (kind === 'submit' ? aiApi.submitDraft(id) : aiApi.applyDraft(id)),
  })
}
