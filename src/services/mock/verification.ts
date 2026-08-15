import { findDocumentByCode, getDocuments, registerVerificationInMock } from './db'
import { delay } from './delay'
import type { VerificationDetails, VerificationOutcome, VerificationQuery } from '@/types/verification'
import type { VeriDocument } from '@/types/document'
import { canonicalizeDocument, sha256Hex } from '@/utils/hashing'

function toDetails(
  document: VeriDocument | null,
  outcome: VerificationOutcome,
  verifiedAt: string,
  message: string,
): VerificationDetails {
  if (!document) {
    return {
      valid: false,
      outcome,
      status: 'INVALID',
      reference: 'n/a',
      verifiedAt,
      message,
      document: {
        id: '',
        number: '',
        title: '',
        type: '',
        holderName: '',
        issuedAt: '',
        issuer: { id: '', name: '' },
      },
    }
  }

  return {
    valid: outcome === 'VALID',
    outcome,
    status: outcome === 'NOT_FOUND' || outcome === 'INVALID' ? 'INVALID' : document.status,
    reference: document.verificationCode,
    verifiedAt,
    message,
    document: {
      id: document.id,
      number: document.number,
      title: document.title,
      type: document.type,
      holderName: document.holderName,
      issuedAt: document.issuedAt,
      issuer: document.institution,
    },
    signature: {
      valid: outcome === 'VALID',
      algorithm: document.signature.algorithm,
      signedBy: document.signature.signedBy,
      signedAt: document.signature.signedAt,
    },
  }
}

export async function mockVerifyDocument(query: VerificationQuery): Promise<VerificationDetails> {
  await delay(650)
  const verifiedAt = new Date().toISOString()

  let document: VeriDocument | null = null
  if (query.code) {
    document = (await findDocumentByCode(query.code)) ?? null
  } else if (query.documentId) {
    const all = await getDocuments()
    const documentId = query.documentId
    document =
      all.find(
        (item) =>
          item.id === documentId || item.number.toLowerCase() === documentId.toLowerCase(),
      ) ?? null
  }

  if (!document) {
    return toDetails(
      null,
      'NOT_FOUND',
      verifiedAt,
      'Não foi possível validar este documento. Verifique o código e tente novamente.',
    )
  }

  await registerVerificationInMock(document, document.status)

  switch (document.status) {
    case 'VALID': {
      const canonical = canonicalizeDocument({
        number: document.number,
        type: document.type,
        title: document.title,
        holderName: document.holderName,
        issuedAt: document.issuedAt,
        institutionId: document.institution.id,
      })
      const recomputedHash = await sha256Hex(canonical)
      if (recomputedHash !== document.contentHash) {
        return toDetails(
          document,
          'INVALID',
          verifiedAt,
          'A integridade do documento não pôde ser confirmada.',
        )
      }
      return toDetails(
        document,
        'VALID',
        verifiedAt,
        'A autenticidade do documento foi confirmada pela VeriDoc.',
      )
    }
    case 'REVOKED':
      return toDetails(
        document,
        'REVOKED',
        verifiedAt,
        'Este documento foi revogado pela instituição emissora.',
      )
    case 'EXPIRED':
      return toDetails(
        document,
        'EXPIRED',
        verifiedAt,
        'Este documento ultrapassou a sua data de validade.',
      )
    case 'PENDING':
      return toDetails(
        document,
        'INVALID',
        verifiedAt,
        'Este documento ainda não se encontra disponível para validação.',
      )
    default:
      return toDetails(document, 'INVALID', verifiedAt, 'Documento com estado inválido.')
  }
}
