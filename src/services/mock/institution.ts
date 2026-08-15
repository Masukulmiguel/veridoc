import { getDb, getInstitution } from './db'
import { delay } from './delay'
import type { DashboardStats, Institution, InstitutionUpdatePayload } from '@/types/institution'
import type { AuditListParams } from '@/types/institution'
import type { Paginated } from '@/types/api'
import type { AuditEvent } from '@/types/institution'

export async function mockGetInstitution(): Promise<Institution> {
  await delay(300)
  return getInstitution()
}

export async function mockUpdateInstitution(
  payload: InstitutionUpdatePayload,
): Promise<Institution> {
  await delay(500)
  const database = await getDb()
  database.institution = { ...database.institution, ...payload, updatedAt: new Date().toISOString() }
  database.audit.unshift({
    id: `aud-${Date.now().toString(36)}`,
    actorId: database.currentUserId ?? 'usr-admin',
    actorName: 'Administrador VeriDoc',
    action: 'INSTITUTION_UPDATED',
    entityType: 'institution',
    entityId: database.institution.id,
    metadata: {},
    createdAt: new Date().toISOString(),
  })
  return database.institution
}

export async function mockGetDashboardStats(): Promise<DashboardStats> {
  await delay(350)
  const database = await getDb()
  const documents = database.documents
  return {
    totalDocuments: documents.length,
    validDocuments: documents.filter((document) => document.status === 'VALID').length,
    revokedDocuments: documents.filter((document) => document.status === 'REVOKED').length,
    totalVerifications: database.verificationEvents.length,
    recentActivity: database.audit.slice(0, 8),
  }
}

export async function mockListAudit(params: AuditListParams): Promise<Paginated<AuditEvent>> {
  await delay(350)
  const database = await getDb()
  let filtered = database.audit
  if (params.action) {
    filtered = filtered.filter((entry) => entry.action === params.action)
  }
  if (params.search) {
    const term = params.search.toLowerCase()
    filtered = filtered.filter(
      (entry) =>
        entry.actorName.toLowerCase().includes(term) ||
        entry.entityId.toLowerCase().includes(term),
    )
  }
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
