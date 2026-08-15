import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from './AuthContext'
import { SESSION_EXPIRED_EVENT } from '@/services/api'
import {
  getCurrentUser,
  getStoredUser,
  login as loginService,
  loginWithGoogle as loginWithGoogleService,
  logout as logoutService,
  register as registerService,
} from '@/services/auth.service'
import type { AuthSession, GoogleLoginPayload, LoginCredentials, RegisterPayload } from '@/types/auth'
import type { User } from '@/types/user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser())
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    async function restoreSession() {
      const accessToken = localStorage.getItem('veridoc.accessToken')
      if (!accessToken) {
        if (active) setIsLoading(false)
        return
      }
      try {
        const currentUser = await getCurrentUser()
        if (active) setUser(currentUser)
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setIsLoading(false)
      }
    }
    void restoreSession()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    function handleSessionExpired() {
      setUser(null)
      navigate('/session-expirada', { replace: true })
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
  }, [navigate])

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthSession> => {
    const session = await loginService(credentials)
    setUser(session.user)
    return session
  }, [])

  const loginWithGoogle = useCallback(
    async (payload: GoogleLoginPayload): Promise<AuthSession> => {
      const session = await loginWithGoogleService(payload)
      setUser(session.user)
      return session
    },
    [],
  )

  const register = useCallback(async (payload: RegisterPayload): Promise<AuthSession> => {
    const session = await registerService(payload)
    setUser(session.user)
    return session
  }, [])

  const logout = useCallback(() => {
    logoutService()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      loginWithGoogle,
      register,
      logout,
    }),
    [user, isLoading, login, loginWithGoogle, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
