import { api } from './api'
import { USE_MOCKS } from './config'
import {
  mockCreateDocument,
  mockGetDocument,
  mockListDocuments,
  mockRevokeDocument,
} from './mock/documents'
import type { Paginated } from '@/types/api'
import type {
  CreateDocumentPayload,
  DocumentField,
  DocumentHistoryEntry,
  DocumentListParams,
  DocumentStatus,
  DocumentType,
  RevokeDocumentPayload,
  VeriDocument,
} from '@/types/document'

function toDocumentFields(fields: Array<{ label: string; value: string }>): DocumentField[] {
  return (fields ?? []).map((field, index) => ({
    key: field.label.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `field-${index}`,
    label: field.label,
    value: field.value,
  }))
}

function toHistory(
  entries: Array<{ id: string; action: string; actorName: string; createdAt: string }>,
): DocumentHistoryEntry[] {
  return (entries ?? []).map((entry) => ({
    id: entry.id,
    event: entry.action,
    actor: entry.actorName,
    at: entry.createdAt,
  }))
}

export async function listDocuments(
  params: DocumentListParams,
  actorName: string,
): Promise<Paginated<VeriDocument>> {
  if (USE_MOCKS) return mockListDocuments(params, actorName)
  const backendParams: Record<string, string | number | undefined> = {
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    status: params.status,
    document_type: params.type,
  }
  const { data } = await api.get<Paginated<VeriDocument>>('/documents', { params: backendParams })
  return data
}

export async function getDocument(id: string): Promise<VeriDocument> {
  if (USE_MOCKS) return mockGetDocument(id)
  const { data } = await api.get<RawDocument>(`/documents/${id}`)
  return toVeriDocument(data)
}

export async function createDocument(payload: CreateDocumentPayload): Promise<VeriDocument> {
  if (USE_MOCKS) return mockCreateDocument(payload)
  const backendPayload = {
    document_type: payload.type,
    title: payload.title,
    holder_name: payload.holderName,
    description: payload.description,
    expires_at: payload.expiresAt ?? null,
    fields: (payload.fields ?? []).map(({ label, value }) => ({ label, value })),
  }
  const { data } = await api.post<RawDocument>('/documents', backendPayload)
  return toVeriDocument(data)
}

export async function revokeDocument(
  id: string,
  payload: RevokeDocumentPayload,
): Promise<VeriDocument> {
  if (USE_MOCKS) return mockRevokeDocument(id, payload.reason)
  const { data } = await api.post<RawDocument>(`/documents/${id}/revoke`, payload)
  return toVeriDocument(data)
}

interface RawDocument {
  id: string
  number: string
  type: DocumentType
  title: string
  holderName: string
  description: string | null
  status: DocumentStatus
  issuedAt: string
  expiresAt: string | null
  verificationCode: string
  contentHash: string
  institution: { id: string; name: string }
  signature?: { algorithm: string; value: string; signedBy: string; signedAt: string }
  verificationCount: number
  fields: Array<{ label: string; value: string }>
  history: Array<{ id: string; action: string; actorName: string; createdAt: string }>
  createdAt: string
  updatedAt?: string
}

function toVeriDocument(data: RawDocument): VeriDocument {
  return {
    ...data,
    updatedAt: data.updatedAt ?? data.createdAt,
    signature: data.signature ?? { algorithm: '', value: '', signedBy: '', signedAt: '' },
    fields: toDocumentFields(data.fields),
    history: toHistory(data.history),
  }
}
