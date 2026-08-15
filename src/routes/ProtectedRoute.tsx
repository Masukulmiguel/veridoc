import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Logo } from '@/components/layout/Logo'
import { Spinner } from '@/components/ui/Spinner'
import type { UserRole } from '@/types/user'

interface ProtectedRouteProps {
  children: ReactNode
  roles?: UserRole[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-navy-50">
        <Logo to="/dashboard" />
        <Spinner size="lg" className="text-primary-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/nao-autorizado" replace />
  }

  return <>{children}</>
}
