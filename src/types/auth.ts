import type { User } from './user'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  institutionName: string
  taxId?: string
  acceptTerms: boolean
}

export interface GoogleLoginPayload {
  idToken: string
}

export interface AuthSession {
  accessToken: string
  refreshToken?: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface SessionUser extends User {}
