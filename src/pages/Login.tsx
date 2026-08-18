import { useEffect } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { AuthShell } from '@/components/auth/AuthShell'
import { LoginForm } from '@/components/forms/LoginForm'
import { useAuth } from '@/hooks/useAuth'
import { setTokens, USER_STORAGE_KEY } from '@/services/api'

export default function Login() {
  const { isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const oauth = searchParams.get('oauth')
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    if (oauth === 'success' && accessToken && refreshToken) {
      setTokens(accessToken, refreshToken)
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((r) => r.json())
        .then((user) => {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
          window.location.replace('/dashboard')
        })
        .catch(() => {
          window.location.replace('/dashboard')
        })
    }
  }, [searchParams])

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AuthShell
      title="Iniciar sessão"
      subtitle="Aceda ao painel da sua instituição."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  )
}
