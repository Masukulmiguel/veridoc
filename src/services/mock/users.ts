import { getDb } from './db'
import { delay } from './delay'
import type { CreateUserPayload, User, UpdateUserPayload } from '@/types/user'
import { randomCode } from '@/utils/identifiers'

export async function mockListUsers(): Promise<User[]> {
  await delay(300)
  const database = await getDb()
  return database.users
}

export async function mockCreateUser(payload: CreateUserPayload): Promise<User> {
  await delay(450)
  const database = await getDb()
  const existing = database.users.find(
    (item) => item.email.toLowerCase() === payload.email.toLowerCase(),
  )
  if (existing) throw new Error('Já existe um utilizador com este e-mail.')
  const now = new Date().toISOString()
  const user: User = {
    id: `usr-${randomCode(6).toLowerCase()}`,
    institutionId: database.institution.id,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  }
  database.users.push(user)
  database.audit.unshift({
    id: `aud-${randomCode(6).toLowerCase()}`,
    actorId: database.currentUserId ?? 'usr-admin',
    actorName: 'Administrador VeriDoc',
    action: 'USER_CREATED',
    entityType: 'user',
    entityId: user.id,
    metadata: { role: payload.role },
    createdAt: now,
  })
  return user
}

export async function mockUpdateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  await delay(400)
  const database = await getDb()
  const user = database.users.find((item) => item.id === id)
  if (!user) throw new Error('Utilizador não encontrado.')
  Object.assign(user, payload, { updatedAt: new Date().toISOString() })
  database.audit.unshift({
    id: `aud-${randomCode(6).toLowerCase()}`,
    actorId: database.currentUserId ?? 'usr-admin',
    actorName: 'Administrador VeriDoc',
    action: 'USER_UPDATED',
    entityType: 'user',
    entityId: user.id,
    metadata: { ...payload },
    createdAt: new Date().toISOString(),
  })
  return user
}

export async function mockDeleteUser(id: string): Promise<void> {
  await delay(400)
  const database = await getDb()
  const index = database.users.findIndex((item) => item.id === id)
  if (index === -1) throw new Error('Utilizador não encontrado.')
  database.users.splice(index, 1)
}
