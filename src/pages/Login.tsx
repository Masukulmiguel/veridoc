import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { AuthShell } from '@/components/auth/AuthShell'
import { LoginForm } from '@/components/forms/LoginForm'
import { useAuth } from '@/hooks/useAuth'
import { setTokens, USER_STORAGE_KEY } from '@/services/api'
import { Alert } from '@/components/ui/Alert'

export default function Login() {
  const { isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()
  const [oauthError, setOauthError] = useState(false)

  useEffect(() => {
    const oauth = searchParams.get('oauth')
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')

    if (oauth === 'error') {
      setOauthError(true)
      window.history.replaceState({}, '', '/login')
      return
    }

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
      {oauthError && (
        <Alert tone="danger" title="Falha na autenticação Google" className="mb-4">
          Não foi possível completar a autenticação com o Google. Tente novamente ou utilize o
          formulário de início de sessão.
        </Alert>
      )}
      <LoginForm />
    </AuthShell>
  )
}
