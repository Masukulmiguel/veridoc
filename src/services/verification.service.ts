import { api } from './api'
import { USE_MOCKS } from './config'
import { mockVerifyDocument } from './mock/verification'
import type { DocumentStatus } from '@/types/document'
import type {
  VerificationDetails,
  VerificationDocumentSummary,
  VerificationOutcome,
  VerificationQuery,
} from '@/types/verification'

function toDocumentSummary(data: {
  id?: string
  number?: string
  type?: string
  title?: string
  holderName?: string
  issuedAt?: string
  issuerName?: string
}): VerificationDocumentSummary {
  return {
    id: data.id ?? '',
    number: data.number ?? '',
    type: data.type ?? '',
    title: data.title ?? '',
    holderName: data.holderName ?? '',
    issuedAt: data.issuedAt ?? '',
    issuer: { id: data.id ?? '', name: data.issuerName ?? '' },
  }
}

export async function verifyDocument(query: VerificationQuery): Promise<VerificationDetails> {
  if (USE_MOCKS) return mockVerifyDocument(query)
  const { data } = await api.get<{
    code: string
    status: string
    message: string
    verifiedAt: string
    document: {
      number?: string
      type?: string
      title?: string
      holderName?: string
      issuedAt?: string
    } | null
    institution: { id?: string; legalName?: string } | null
    signature: { valid: boolean; algorithm?: string | null } | null
  }>(query.code ? `/verify/${query.code}` : '/verify', { params: query })
  return {
    valid: data.status === 'VALID',
    outcome: (data.status === 'INVALID' && !data.document
      ? 'NOT_FOUND'
      : data.status) as VerificationOutcome,
    status: (data.status === 'NOT_FOUND' ? 'INVALID' : data.status) as DocumentStatus,
    reference: data.code,
    verifiedAt: data.verifiedAt,
    document: toDocumentSummary({
      ...data.document,
      id: data.document?.number,
      issuerName: data.institution?.legalName,
    }),
    signature: data.signature
      ? {
          valid: data.signature.valid,
          algorithm: data.signature.algorithm ?? '',
          signedBy: '',
          signedAt: '',
        }
      : undefined,
    message: data.message,
  }
}
