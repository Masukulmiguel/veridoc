import { getDb } from './db'
import { delay } from './delay'
import type { AuthSession, GoogleLoginPayload, LoginCredentials, RegisterPayload } from '@/types/auth'
import type { User } from '@/types/user'
import { randomCode } from '@/utils/identifiers'

export const MOCK_CREDENTIALS = [
  { email: 'admin@veridoc.ao', password: 'veridoc123', userId: 'usr-admin' },
  { email: 'emissor@veridoc.ao', password: 'veridoc123', userId: 'usr-issuer' },
  { email: 'consultor@veridoc.ao', password: 'veridoc123', userId: 'usr-viewer' },
]

async function buildSession(user: User): Promise<AuthSession> {
  const database = await getDb()
  database.currentUserId = user.id
  return {
    accessToken: `mock-access-${randomCode(24)}`,
    refreshToken: `mock-refresh-${randomCode(24)}`,
    tokenType: 'Bearer',
    expiresIn: 3600,
    user,
  }
}

export async function mockLogin(credentials: LoginCredentials): Promise<AuthSession> {
  await delay()
  const match = MOCK_CREDENTIALS.find(
    (entry) => entry.email.toLowerCase() === credentials.email.toLowerCase(),
  )
  if (!match || match.password !== credentials.password) {
    throw new Error('E-mail ou palavra-passe incorrectos.')
  }
  const database = await getDb()
  const user = database.users.find((item) => item.id === match.userId)
  if (!user) throw new Error('Utilizador não encontrado.')
  if (user.status !== 'ACTIVE') {
    throw new Error('Conta suspensa. Contacte o administrador da instituição.')
  }
  return buildSession(user)
}

export async function mockLoginWithGoogle(_payload: GoogleLoginPayload): Promise<AuthSession> {
  await delay()
  const database = await getDb()
  const user = database.users.find((item) => item.id === 'usr-admin')
  if (!user) throw new Error('Utilizador não encontrado.')
  return buildSession(user)
}

export async function mockRegister(payload: RegisterPayload): Promise<AuthSession> {
  await delay()
  const database = await getDb()
  const existing = database.users.find(
    (item) => item.email.toLowerCase() === payload.email.toLowerCase(),
  )
  if (existing) throw new Error('Já existe uma conta com este e-mail.')
  if (!payload.acceptTerms) throw new Error('É necessário aceitar os termos de utilização.')

  const user: User = {
    id: `usr-${randomCode(6).toLowerCase()}`,
    institutionId: database.institution.id,
    name: payload.name,
    email: payload.email,
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  database.users.push(user)
  database.institution.legalName = payload.institutionName
  database.institution.taxId = payload.taxId ?? null
  database.audit.unshift({
    id: `aud-${randomCode(6).toLowerCase()}`,
    actorId: user.id,
    actorName: user.name,
    action: 'USER_CREATED',
    entityType: 'user',
    entityId: user.id,
    metadata: { role: 'ADMIN' },
    createdAt: new Date().toISOString(),
  })
  return buildSession(user)
}

export async function mockGetCurrentUser(): Promise<User> {
  await delay(250)
  const database = await getDb()
  const userId = database.currentUserId ?? 'usr-admin'
  const user = database.users.find((item) => item.id === userId)
  if (!user) throw new Error('Utilizador não encontrado.')
  return user
}
