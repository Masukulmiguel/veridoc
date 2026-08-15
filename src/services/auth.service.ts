import { api, clearSession, setTokens, USER_STORAGE_KEY } from './api'
import { USE_MOCKS } from './config'
import {
  mockGetCurrentUser,
  mockLogin,
  mockLoginWithGoogle,
  mockRegister,
} from './mock/auth'
import type {
  AuthSession,
  GoogleLoginPayload,
  LoginCredentials,
  RegisterPayload,
} from '@/types/auth'
import type { User } from '@/types/user'

function persistSession(session: AuthSession): void {
  setTokens(session.accessToken, session.refreshToken)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session.user))
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  if (USE_MOCKS) return mockLogin(credentials)
  const { data } = await api.post<AuthSession>('/auth/login', credentials)
  persistSession(data)
  return data
}

export async function loginWithGoogle(payload: GoogleLoginPayload): Promise<AuthSession> {
  if (USE_MOCKS) return mockLoginWithGoogle(payload)
  const { data } = await api.post<AuthSession>('/auth/google', payload)
  persistSession(data)
  return data
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  if (USE_MOCKS) return mockRegister(payload)
  const { data } = await api.post<AuthSession>('/auth/register', payload)
  persistSession(data)
  return data
}

export async function getCurrentUser(): Promise<User> {
  if (USE_MOCKS) return mockGetCurrentUser()
  const { data } = await api.get<User>('/auth/me')
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data))
  return data
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function logout(): void {
  clearSession()
}

export function getGoogleOAuthUrl(): string {
  return `${import.meta.env.VITE_API_URL ?? ''}/auth/google`
}
