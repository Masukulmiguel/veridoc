import { api } from './api'
import { USE_MOCKS } from './config'
import {
  mockGetDashboardStats,
  mockGetInstitution,
  mockUpdateInstitution,
} from './mock/institution'
import type { DashboardStats, Institution, InstitutionUpdatePayload } from '@/types/institution'

export async function getInstitution(): Promise<Institution> {
  if (USE_MOCKS) return mockGetInstitution()
  const { data } = await api.get<Institution>('/institutions/me')
  return data
}

export async function updateInstitution(
  payload: InstitutionUpdatePayload,
): Promise<Institution> {
  if (USE_MOCKS) return mockUpdateInstitution(payload)
  const { data } = await api.put<Institution>('/institutions/me', payload)
  return data
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (USE_MOCKS) return mockGetDashboardStats()
  const { data } = await api.get<DashboardStats>('/dashboard')
  return data
}
