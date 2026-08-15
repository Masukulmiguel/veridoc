import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'

export default function SessionExpired() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-navy-50 px-4">
      <Logo to="/" />
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-warning-100 text-warning-600">
          <Clock className="size-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Sessão expirada</h1>
        <p className="mt-3 max-w-sm text-navy-500">
          A sua sessão expirou por segurança. Inicie sessão novamente para continuar.
        </p>
      </div>
      <Link to="/login">
        <Button>Iniciar sessão</Button>
      </Link>
    </div>
  )
}
