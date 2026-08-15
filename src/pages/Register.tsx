import { Link, Navigate } from 'react-router-dom'
import { AuthShell } from '@/components/auth/AuthShell'
import { RegisterForm } from '@/components/forms/RegisterForm'
import { useAuth } from '@/hooks/useAuth'

export default function Register() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Registe a sua instituição na VeriDoc."
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
            Iniciar sessão
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}
