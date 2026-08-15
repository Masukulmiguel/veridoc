import { Link } from 'react-router-dom'
import { Home, TriangleAlert } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-navy-50 px-4">
      <Logo to="/" />
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-danger-100 text-danger-600">
          <TriangleAlert className="size-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-navy-900">
          Ocorreu um erro inesperado.
        </h1>
        <p className="mt-3 max-w-sm text-navy-500">
          Pedimos desculpa pelo incómodo. Tente novamente em instantes.
        </p>
      </div>
      <Link to="/">
        <Button variant="outline" leftIcon={<Home className="size-4" />}>
          Voltar ao início
        </Button>
      </Link>
    </div>
  )
}
