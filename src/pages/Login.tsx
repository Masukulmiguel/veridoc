import { Link, Navigate } from 'react-router-dom'
import { AuthShell } from '@/components/auth/AuthShell'
import { LoginForm } from '@/components/forms/LoginForm'
import { useAuth } from '@/hooks/useAuth'

export default function Login() {
  const { isAuthenticated } = useAuth()

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
