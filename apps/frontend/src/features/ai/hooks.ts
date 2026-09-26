import { useMutation, useQuery } from '@tanstack/react-query'
import { aiApi } from './api'

export const AI_QUOTA_KEY = ['ai', 'quota'] as const

export function useAiQuota() {
  return useQuery({ queryKey: AI_QUOTA_KEY, queryFn: aiApi.quota })
}

/** Lịch sử chỉ nạp một lần khi mở trang; tin mới nằm ở state của cuộc trò chuyện. */
export function useAiMessages() {
  return useQuery({ queryKey: ['ai', 'messages'], queryFn: aiApi.messages, staleTime: Infinity })
}

export function useDraftAction(kind: 'submit' | 'apply') {
  return useMutation({
    mutationFn: (id: number) => (kind === 'submit' ? aiApi.submitDraft(id) : aiApi.applyDraft(id)),
  })
}
