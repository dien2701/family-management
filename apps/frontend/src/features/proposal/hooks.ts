import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { proposalApi } from './api'
import type { Schemas } from '@/types/api'

export const proposalKeys = {
  all: ['proposals'] as const,
  mine: (page: number, size: number) => [...proposalKeys.all, 'mine', page, size] as const,
  admin: (page: number, size: number, status?: string) => [...proposalKeys.all, 'admin', page, size, status] as const,
  count: () => [...proposalKeys.all, 'count'] as const,
}

export function useMyProposals(page: number, size: number) {
  return useQuery({
    queryKey: proposalKeys.mine(page, size),
    queryFn: () => proposalApi.getMine(page, size) as Promise<Schemas['ProposalPage']>,
  })
}

export function useAdminProposals(page: number, size: number, status?: string) {
  return useQuery({
    queryKey: proposalKeys.admin(page, size, status),
    queryFn: () => proposalApi.getAll(page, size, status) as Promise<Schemas['ProposalPage']>,
  })
}

export function usePendingProposalsCount() {
  return useQuery({
    queryKey: proposalKeys.count(),
    queryFn: () => proposalApi.getCount() as Promise<number>,
  })
}

export function useCreateProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Schemas['ProposalInput']) => proposalApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.all })
    },
  })
}

export function useApproveProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, modifiedPayload }: { id: number; modifiedPayload?: Record<string, any> }) =>
      proposalApi.approve(id, modifiedPayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.all })
      queryClient.invalidateQueries({ queryKey: ['events'] }) // Invalidate events too
    },
  })
}

export function useRejectProposal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => proposalApi.reject(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.all })
    },
  })
}
