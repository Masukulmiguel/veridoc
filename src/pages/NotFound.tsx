import { Link } from 'react-router-dom'
import { Home, SearchX } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-navy-50 px-4">
      <Logo to="/" />
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-navy-100 text-navy-500">
          <SearchX className="size-8" />
        </div>
        <h1 className="font-display text-5xl font-extrabold text-navy-900">404</h1>
        <p className="mt-3 text-navy-500">
          A página que procura não existe ou foi movida.
        </p>
      </div>
      <div className="flex gap-3">
        <Link to="/">
          <Button variant="outline" leftIcon={<Home className="size-4" />}>
            Ir para o início
          </Button>
        </Link>
        <Link to="/verificar">
          <Button>Validar documento</Button>
        </Link>
      </div>
    </div>
  )
}
