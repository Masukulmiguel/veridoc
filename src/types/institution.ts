export type InstitutionStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING'
export type PlanId = 'starter' | 'professional' | 'enterprise'

export interface Institution {
  id: string
  legalName: string
  taxId: string | null
  email: string
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  website: string | null
  logo: string | null
  status: InstitutionStatus
  plan: PlanId
  planActivatedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface InstitutionUpdatePayload {
  legalName: string
  taxId?: string | null
  email: string
  phone?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  website?: string | null
}

export interface DashboardStats {
  totalDocuments: number
  validDocuments: number
  revokedDocuments: number
  totalVerifications: number
  recentActivity: AuditEvent[]
}

export type AuditEventType =
  | 'USER_CREATED'
  | 'LOGIN'
  | 'DOCUMENT_CREATED'
  | 'DOCUMENT_SIGNED'
  | 'DOCUMENT_VERIFIED'
  | 'DOCUMENT_REVOKED'
  | 'INSTITUTION_UPDATED'
  | 'USER_UPDATED'

export interface AuditEvent {
  id: string
  actorId: string
  actorName: string
  action: AuditEventType
  entityType: string
  entityId: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface AuditListParams {
  page?: number
  pageSize?: number
  action?: AuditEventType
  search?: string
}
