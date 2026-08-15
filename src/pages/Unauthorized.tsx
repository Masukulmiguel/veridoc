import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function Unauthorized() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-navy-50 px-4">
      <Logo to="/" />
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-warning-100 text-warning-600">
          <ShieldOff className="size-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-navy-900">
          Acesso não autorizado
        </h1>
        <p className="mt-3 max-w-sm text-navy-500">
          {user
            ? `A sua função (${user.role.toLowerCase()}) não tem permissão para aceder a esta página.`
            : 'Não tem permissão para aceder a esta página.'}
        </p>
      </div>
      <div className="flex gap-3">
        <Link to="/dashboard">
          <Button variant="outline">Ir para o dashboard</Button>
        </Link>
        <Link to="/verificar">
          <Button>Validar documento</Button>
        </Link>
      </div>
    </div>
  )
}
