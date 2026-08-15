import { createContext } from 'react'
import type { AuthSession, GoogleLoginPayload, LoginCredentials, RegisterPayload } from '@/types/auth'
import type { User } from '@/types/user'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<AuthSession>
  loginWithGoogle: (payload: GoogleLoginPayload) => Promise<AuthSession>
  register: (payload: RegisterPayload) => Promise<AuthSession>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
