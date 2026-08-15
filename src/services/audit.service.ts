import { api } from './api'
import { USE_MOCKS } from './config'
import { mockListAudit } from './mock/institution'
import type { Paginated } from '@/types/api'
import type { AuditEvent, AuditListParams } from '@/types/institution'

export async function listAudit(params: AuditListParams): Promise<Paginated<AuditEvent>> {
  if (USE_MOCKS) return mockListAudit(params)
  const { data } = await api.get<Paginated<AuditEvent>>('/audit', { params })
  return data
}
