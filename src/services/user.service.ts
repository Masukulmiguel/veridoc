import { api } from './api'
import { USE_MOCKS } from './config'
import { mockCreateUser, mockDeleteUser, mockListUsers, mockUpdateUser } from './mock/users'
import type { CreateUserPayload, UpdateUserPayload, User } from '@/types/user'

export async function listUsers(): Promise<User[]> {
  if (USE_MOCKS) return mockListUsers()
  const { data } = await api.get<User[]>('/users')
  return data
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  if (USE_MOCKS) return mockCreateUser(payload)
  const { data } = await api.post<User>('/users', payload)
  return data
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  if (USE_MOCKS) return mockUpdateUser(id, payload)
  const { data } = await api.put<User>(`/users/${id}`, payload)
  return data
}

export async function deleteUser(id: string): Promise<void> {
  if (USE_MOCKS) return mockDeleteUser(id)
  await api.delete(`/users/${id}`)
}
