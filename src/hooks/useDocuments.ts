import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import {
  createDocument,
  getDocument,
  listDocuments,
  revokeDocument,
} from '@/services/document.service'
import type {
  CreateDocumentPayload,
  DocumentListParams,
  RevokeDocumentPayload,
  VeriDocument,
} from '@/types/document'

export function useDocuments(params: DocumentListParams) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => listDocuments(params, user?.name ?? ''),
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => getDocument(id),
    enabled: Boolean(id),
  })
}

export function useCreateDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDocumentPayload) => createDocument(payload),
    onSuccess: (document: VeriDocument) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.setQueryData(['document', document.id], document)
    },
  })
}

export function useRevokeDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: RevokeDocumentPayload & { id: string }) =>
      revokeDocument(id, { reason }),
    onSuccess: (document: VeriDocument) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['audit'] })
      queryClient.setQueryData(['document', document.id], document)
    },
  })
}
