export type UserRole = 'ADMIN' | 'ISSUER' | 'VIEWER'

export type UserStatus = 'ACTIVE' | 'SUSPENDED'

export interface User {
  id: string
  institutionId: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: UserRole
}

export interface UpdateUserPayload {
  name?: string
  role?: UserRole
  status?: UserStatus
}
