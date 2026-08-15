import { createDocumentInMock, getDocuments, revokeDocumentInMock, getInstitution } from './db'
import { delay } from './delay'
import type {
  CreateDocumentPayload,
  DocumentListParams,
  VeriDocument,
} from '@/types/document'
import type { Paginated } from '@/types/api'

export async function mockListDocuments(
  params: DocumentListParams,
  currentUserName: string,
): Promise<Paginated<VeriDocument>> {
  await delay(350)
  void currentUserName
  const all = await getDocuments()

  let filtered = all
  if (params.search) {
    const term = params.search.toLowerCase()
    filtered = filtered.filter(
      (document) =>
        document.holderName.toLowerCase().includes(term) ||
        document.number.toLowerCase().includes(term) ||
        document.title.toLowerCase().includes(term) ||
        document.verificationCode.toLowerCase().includes(term),
    )
  }
  if (params.status) {
    filtered = filtered.filter((document) => document.status === params.status)
  }
  if (params.type) {
    filtered = filtered.filter((document) => document.type === params.type)
  }

  const sortBy = params.sortBy ?? 'issuedAt'
  const sortOrder = params.sortOrder ?? 'desc'
  filtered = [...filtered].sort((a, b) => {
    const aValue = String(a[sortBy as keyof VeriDocument] ?? '')
    const bValue = String(b[sortBy as keyof VeriDocument] ?? '')
    const comparison = aValue.localeCompare(bValue)
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  const start = (page - 1) * pageSize
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
  }
}

export async function mockGetDocument(id: string): Promise<VeriDocument> {
  await delay(300)
  const all = await getDocuments()
  const document = all.find((item) => item.id === id)
  if (!document) throw new Error('Documento não encontrado.')
  return document
}

export async function mockCreateDocument(payload: CreateDocumentPayload): Promise<VeriDocument> {
  await delay(600)
  const institution = await getInstitution()
  return createDocumentInMock(payload, institution.legalName, 'Administrador VeriDoc')
}

export async function mockRevokeDocument(
  id: string,
  reason: string | undefined,
): Promise<VeriDocument> {
  await delay(500)
  return revokeDocumentInMock(id, reason, 'Administrador VeriDoc')
}
