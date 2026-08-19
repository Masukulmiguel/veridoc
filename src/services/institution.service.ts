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

export async function uploadInstitutionLogo(file: File): Promise<Institution> {
  if (USE_MOCKS) return mockUpdateInstitution({} as InstitutionUpdatePayload)
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<Institution>('/institutions/me/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function deleteInstitutionLogo(): Promise<Institution> {
  if (USE_MOCKS) return mockUpdateInstitution({} as InstitutionUpdatePayload)
  const { data } = await api.delete<Institution>('/institutions/me/logo')
  return data
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (USE_MOCKS) return mockGetDashboardStats()
  const { data } = await api.get<DashboardStats>('/dashboard')
  return data
}

export async function fetchInstitutionLogoDataUrl(institutionId: string): Promise<string | null> {
  if (USE_MOCKS) return null
  try {
    const { data } = await api.get(`/institutions/${institutionId}/logo`, { responseType: 'blob' })
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(data)
    })
  } catch {
    return null
  }
}
