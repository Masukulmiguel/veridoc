export type DocumentStatus = 'VALID' | 'REVOKED' | 'EXPIRED' | 'INVALID' | 'PENDING'

export type DocumentType =
  | 'CERTIFICATE'
  | 'DIPLOMA'
  | 'TRANSCRIPT'
  | 'DECLARATION'
  | 'CONTRACT'
  | 'OTHER'

export interface DocumentField {
  key: string
  label: string
  value: string
}

export interface DocumentSignature {
  algorithm: string
  value: string
  signedBy: string
  signedAt: string
}

export interface DocumentHistoryEntry {
  id: string
  event: string
  actor: string
  at: string
}

export interface DocumentInstitution {
  id: string
  name: string
}

export interface VeriDocument {
  id: string
  number: string
  type: DocumentType
  title: string
  holderName: string
  description: string | null
  status: DocumentStatus
  issuedAt: string
  expiresAt: string | null
  institution: DocumentInstitution
  verificationCode: string
  contentHash: string
  signature: DocumentSignature
  verificationCount: number
  fields: DocumentField[]
  history: DocumentHistoryEntry[]
  createdAt: string
  updatedAt: string
}

export interface CreateDocumentPayload {
  type: DocumentType
  title: string
  holderName: string
  number: string
  description?: string
  issuedAt: string
  expiresAt?: string | null
  fields: DocumentField[]
}

export interface RevokeDocumentPayload {
  reason?: string
}

export interface DocumentListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: DocumentStatus
  type?: DocumentType
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
