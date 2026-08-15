import type { DocumentStatus } from './document'

export interface VerificationIssuer {
  id: string
  name: string
}

export type VerificationOutcome = 'VALID' | 'REVOKED' | 'EXPIRED' | 'NOT_FOUND' | 'INVALID'

export interface VerificationDocumentSummary {
  id: string
  number: string
  title: string
  type: string
  holderName: string
  issuedAt: string
  issuer: VerificationIssuer
}

export interface VerificationSignature {
  valid: boolean
  algorithm: string
  signedBy: string
  signedAt: string
}

export interface VerificationDetails {
  valid: boolean
  outcome: VerificationOutcome
  status: DocumentStatus
  reference: string
  verifiedAt: string
  document: VerificationDocumentSummary
  signature?: VerificationSignature
  message: string
}

export interface VerificationQuery {
  code?: string
  documentId?: string
}
