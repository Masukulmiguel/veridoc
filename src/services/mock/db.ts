import type {
  CreateDocumentPayload,
  DocumentStatus,
  DocumentType,
  VeriDocument,
} from '@/types/document'
import type { Institution, AuditEvent } from '@/types/institution'
import type { User } from '@/types/user'
import { canonicalizeDocument, sha256Hex } from '@/utils/hashing'
import { generateUuid } from '@/utils/identifiers'

const DEMO_INSTITUTION_NAME = 'Universidade de Demonstração'

export interface MockVerificationEvent {
  id: string
  documentId: string
  verificationCode: string
  result: DocumentStatus
  createdAt: string
}

interface MockDatabase {
  institution: Institution
  users: User[]
  documents: VeriDocument[]
  audit: AuditEvent[]
  verificationEvents: MockVerificationEvent[]
  currentUserId: string | null
}

let db: MockDatabase | null = null
let seeded = false

function iso(daysAgo: number, hoursAgo = 0): string {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000)
  return date.toISOString()
}

function isoFuture(daysAhead: number): string {
  const date = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
  return date.toISOString()
}

function mockSignature(hash: string, signedBy: string, signedAt: string) {
  return {
    algorithm: 'RS256',
    value: `mock-signature:${hash.slice(0, 40)}`,
    signedBy,
    signedAt,
  }
}

interface MockDocSeed {
  id: string
  number: string
  type: DocumentType
  title: string
  holderName: string
  description: string
  status: DocumentStatus
  issuedDaysAgo: number
  expiresInDays?: number
  verificationCount: number
  fields: Array<{ label: string; value: string }>
}

async function buildMockDocument(
  institution: Institution,
  seed: MockDocSeed,
): Promise<VeriDocument> {
  const issuedAt = iso(seed.issuedDaysAgo)
  const verificationCode = `V${seed.id.replace('doc-', '').toUpperCase()}${seed.id.replace('doc-', '')}`
  const canonical = canonicalizeDocument({
    number: seed.number,
    type: seed.type,
    title: seed.title,
    holderName: seed.holderName,
    issuedAt,
    institutionId: institution.id,
  })
  const contentHash = await sha256Hex(canonical)

  return {
    id: seed.id,
    number: seed.number,
    type: seed.type,
    title: seed.title,
    holderName: seed.holderName,
    description: seed.description,
    status: seed.status,
    issuedAt,
    expiresAt: seed.expiresInDays ? isoFuture(seed.expiresInDays) : null,
    institution: { id: institution.id, name: institution.legalName },
    verificationCode,
    contentHash,
    signature: mockSignature(contentHash, institution.legalName, issuedAt),
    verificationCount: seed.verificationCount,
    fields: seed.fields.map((field) => ({ key: field.label.toLowerCase().replace(/\s+/g, '_'), ...field })),
    history: [
      { id: generateUuid(), event: 'Documento emitido', actor: 'Administrador', at: issuedAt },
    ],
    createdAt: issuedAt,
    updatedAt: issuedAt,
  }
}

const DOC_SEEDS: MockDocSeed[] = [
  {
    id: 'doc-001',
    number: 'VD-2026-0001',
    type: 'CERTIFICATE',
    title: 'Certificado de Conclusão',
    holderName: 'Maria Santos',
    description: 'Conclusão com aproveitamento do curso de Introdução à Programação.',
    status: 'VALID',
    issuedDaysAgo: 5,
    expiresInDays: 365,
    verificationCount: 18,
    fields: [
      { label: 'Carga horária', value: '40 horas' },
      { label: 'Classificação', value: '18 valores' },
      { label: 'Curso', value: 'Introdução à Programação' },
    ],
  },
  {
    id: 'doc-002',
    number: 'VD-2026-0002',
    type: 'DIPLOMA',
    title: 'Diploma de Licenciatura',
    holderName: 'João Mendes',
    description: 'Licenciatura em Engenharia Informática.',
    status: 'VALID',
    issuedDaysAgo: 40,
    verificationCount: 42,
    fields: [
      { label: 'Grau', value: 'Licenciatura' },
      { label: 'Área', value: 'Engenharia Informática' },
      { label: 'Média final', value: '16 valores' },
    ],
  },
  {
    id: 'doc-003',
    number: 'VD-2026-0003',
    type: 'TRANSCRIPT',
    title: 'Certidão de Notas',
    holderName: 'Ana Costa',
    description: 'Certidão de notas do ano lectivo 2025/2026.',
    status: 'VALID',
    issuedDaysAgo: 12,
    verificationCount: 7,
    fields: [
      { label: 'Ano lectivo', value: '2025/2026' },
      { label: 'Semestre', value: '1º Semestre' },
    ],
  },
  {
    id: 'doc-004',
    number: 'VD-2026-0004',
    type: 'DECLARATION',
    title: 'Declaração de Matrícula',
    holderName: 'Pedro Almeida',
    description: 'Declaração de matrícula no ano lectivo 2026/2027.',
    status: 'REVOKED',
    issuedDaysAgo: 20,
    verificationCount: 5,
    fields: [{ label: 'Ano lectivo', value: '2026/2027' }],
  },
  {
    id: 'doc-005',
    number: 'VD-2026-0005',
    type: 'CERTIFICATE',
    title: 'Certificado de Formação Profissional',
    holderName: 'Luísa Fernandes',
    description: 'Formação profissional em Gestão Administrativa.',
    status: 'EXPIRED',
    issuedDaysAgo: 400,
    expiresInDays: -30,
    verificationCount: 3,
    fields: [
      { label: 'Carga horária', value: '120 horas' },
      { label: 'Área', value: 'Gestão Administrativa' },
    ],
  },
  {
    id: 'doc-006',
    number: 'VD-2026-0006',
    type: 'CONTRACT',
    title: 'Contrato de Prestação de Serviços',
    holderName: 'Carlos Sousa',
    description: 'Contrato de prestação de serviços de consultoria.',
    status: 'PENDING',
    issuedDaysAgo: 0,
    verificationCount: 0,
    fields: [
      { label: 'Vigência', value: '12 meses' },
      { label: 'Valor', value: 'Confidencial' },
    ],
  },
  {
    id: 'doc-007',
    number: 'VD-2026-0007',
    type: 'DIPLOMA',
    title: 'Diploma de Mestrado',
    holderName: 'Beatriz Nunes',
    description: 'Mestrado em Ciência de Dados.',
    status: 'VALID',
    issuedDaysAgo: 90,
    verificationCount: 31,
    fields: [
      { label: 'Grau', value: 'Mestrado' },
      { label: 'Área', value: 'Ciência de Dados' },
      { label: 'Média final', value: '17 valores' },
    ],
  },
  {
    id: 'doc-008',
    number: 'VD-2026-0008',
    type: 'TRANSCRIPT',
    title: 'Certidão de Notas',
    holderName: 'Rui Carvalho',
    description: 'Certidão de notas do ano lectivo 2024/2025.',
    status: 'VALID',
    issuedDaysAgo: 150,
    verificationCount: 11,
    fields: [{ label: 'Ano lectivo', value: '2024/2025' }],
  },
]

async function seed(): Promise<void> {
  if (seeded && db) return

  const now = iso(0)
  const institution: Institution = {
    id: 'inst-001',
    legalName: DEMO_INSTITUTION_NAME,
    taxId: '500000001',
    email: 'geral@instituicao-demo.ao',
    phone: '+244 900 000 000',
    address: 'Av. da Independência, 123',
    city: 'Luanda',
    country: 'Angola',
    website: 'https://instituicao-demo.ao',
    logo: null,
    status: 'ACTIVE',
    createdAt: iso(300),
    updatedAt: now,
  }

  const users: User[] = [
    {
      id: 'usr-admin',
      institutionId: 'inst-001',
      name: 'Administrador VeriDoc',
      email: 'admin@veridoc.ao',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: iso(300),
      updatedAt: now,
    },
    {
      id: 'usr-issuer',
      institutionId: 'inst-001',
      name: 'Emissor VeriDoc',
      email: 'emissor@veridoc.ao',
      role: 'ISSUER',
      status: 'ACTIVE',
      createdAt: iso(290),
      updatedAt: now,
    },
    {
      id: 'usr-viewer',
      institutionId: 'inst-001',
      name: 'Consultor VeriDoc',
      email: 'consultor@veridoc.ao',
      role: 'VIEWER',
      status: 'ACTIVE',
      createdAt: iso(280),
      updatedAt: now,
    },
  ]

  const documents: VeriDocument[] = []
  for (const seedEntry of DOC_SEEDS) {
    documents.push(await buildMockDocument(institution, seedEntry))
  }

  const audit: AuditEvent[] = [
    {
      id: 'aud-001',
      actorId: 'usr-admin',
      actorName: 'Administrador VeriDoc',
      action: 'DOCUMENT_VERIFIED',
      entityType: 'document',
      entityId: 'doc-001',
      metadata: { result: 'VALID' },
      createdAt: iso(0, 1),
    },
    {
      id: 'aud-002',
      actorId: 'usr-issuer',
      actorName: 'Emissor VeriDoc',
      action: 'DOCUMENT_CREATED',
      entityType: 'document',
      entityId: 'doc-006',
      metadata: { number: 'VD-2026-0006' },
      createdAt: iso(0, 3),
    },
    {
      id: 'aud-003',
      actorId: 'usr-admin',
      actorName: 'Administrador VeriDoc',
      action: 'DOCUMENT_REVOKED',
      entityType: 'document',
      entityId: 'doc-004',
      metadata: { reason: 'Emissão por erro administrativo' },
      createdAt: iso(1),
    },
    {
      id: 'aud-004',
      actorId: 'usr-admin',
      actorName: 'Administrador VeriDoc',
      action: 'LOGIN',
      entityType: 'user',
      entityId: 'usr-admin',
      metadata: {},
      createdAt: iso(0, 2),
    },
    {
      id: 'aud-005',
      actorId: 'usr-admin',
      actorName: 'Administrador VeriDoc',
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: 'usr-viewer',
      metadata: { role: 'VIEWER' },
      createdAt: iso(280),
    },
  ]

  const verificationEvents: MockVerificationEvent[] = [
    {
      id: 'ver-001',
      documentId: 'doc-001',
      verificationCode: 'VDOC1',
      result: 'VALID',
      createdAt: iso(0, 1),
    },
  ]

  db = { institution, users, documents, audit, verificationEvents, currentUserId: null }
  seeded = true
}

export async function getDb(): Promise<MockDatabase> {
  await seed()
  return db as MockDatabase
}

export async function getInstitution(): Promise<Institution> {
  const database = await getDb()
  return database.institution
}

export async function getDocuments(): Promise<VeriDocument[]> {
  const database = await getDb()
  return database.documents
}

export async function findDocumentById(id: string): Promise<VeriDocument | undefined> {
  const database = await getDb()
  return database.documents.find((document) => document.id === id)
}

export async function findDocumentByCode(code: string): Promise<VeriDocument | undefined> {
  const database = await getDb()
  return database.documents.find(
    (document) => document.verificationCode.toUpperCase() === code.trim().toUpperCase(),
  )
}

export async function createDocumentInMock(
  payload: CreateDocumentPayload,
  institutionName: string,
  actorName: string,
): Promise<VeriDocument> {
  const database = await getDb()
  const issuedAt = new Date(payload.issuedAt).toISOString()
  const canonical = canonicalizeDocument({
    number: payload.number,
    type: payload.type,
    title: payload.title,
    holderName: payload.holderName,
    issuedAt,
    institutionId: database.institution.id,
  })
  const contentHash = await sha256Hex(canonical)
  const id = `doc-${String(database.documents.length + 1).padStart(3, '0')}`
  const verificationCode = `V${id.replace('doc-', '').toUpperCase()}`

  const document: VeriDocument = {
    id,
    number: payload.number,
    type: payload.type,
    title: payload.title,
    holderName: payload.holderName,
    description: payload.description ?? null,
    status: 'VALID',
    issuedAt,
    expiresAt: payload.expiresAt ? new Date(payload.expiresAt).toISOString() : null,
    institution: { id: database.institution.id, name: institutionName },
    verificationCode,
    contentHash,
    signature: mockSignature(contentHash, institutionName, issuedAt),
    verificationCount: 0,
    fields: payload.fields,
    history: [{ id: generateUuid(), event: 'Documento emitido', actor: actorName, at: issuedAt }],
    createdAt: issuedAt,
    updatedAt: issuedAt,
  }

  database.documents.unshift(document)
  database.audit.unshift({
    id: generateUuid(),
    actorId: database.currentUserId ?? 'usr-admin',
    actorName,
    action: 'DOCUMENT_CREATED',
    entityType: 'document',
    entityId: id,
    metadata: { number: payload.number },
    createdAt: new Date().toISOString(),
  })
  return document
}

export async function revokeDocumentInMock(
  id: string,
  reason: string | undefined,
  actorName: string,
): Promise<VeriDocument> {
  const database = await getDb()
  const document = database.documents.find((item) => item.id === id)
  if (!document) throw new Error('Documento não encontrado')
  const now = new Date().toISOString()
  document.status = 'REVOKED'
  document.updatedAt = now
  document.history.unshift({
    id: generateUuid(),
    event: 'Documento revogado',
    actor: actorName,
    at: now,
  })
  database.audit.unshift({
    id: generateUuid(),
    actorId: database.currentUserId ?? 'usr-admin',
    actorName,
    action: 'DOCUMENT_REVOKED',
    entityType: 'document',
    entityId: id,
    metadata: { reason: reason ?? null },
    createdAt: now,
  })
  return document
}

export async function registerVerificationInMock(
  document: VeriDocument,
  result: DocumentStatus,
): Promise<void> {
  const database = await getDb()
  document.verificationCount += 1
  database.verificationEvents.unshift({
    id: generateUuid(),
    documentId: document.id,
    verificationCode: document.verificationCode,
    result,
    createdAt: new Date().toISOString(),
  })
  database.audit.unshift({
    id: generateUuid(),
    actorId: 'public',
    actorName: 'Validação pública',
    action: 'DOCUMENT_VERIFIED',
    entityType: 'document',
    entityId: document.id,
    metadata: { result },
    createdAt: new Date().toISOString(),
  })
}
