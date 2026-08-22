import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, ShieldCheck, X } from 'lucide-react'
import { Logo } from './Logo'
import { Button } from '@/components/ui/Button'

const NAV_LINKS = [
  { label: 'Como funciona', href: '/#como-funciona' },
  { label: 'Benefícios', href: '/#beneficios' },
  { label: 'Precos', href: '/precificacao' },
  { label: 'Validar', href: '/verificar' },
  { label: 'Para instituições', href: '/#instituicoes' },
]

export function PublicNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo to="/" />

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegação principal">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm font-medium text-navy-600 transition-colors hover:text-navy-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Link to="/verificar">
            <Button variant="outline" size="sm" leftIcon={<ShieldCheck className="size-4" />}>
              Validar documento
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Criar conta</Button>
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-navy-600 hover:bg-navy-100 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-navy-100 bg-white px-4 pb-6 pt-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Navegação móvel">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            <Link to="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" fullWidth>
                Entrar
              </Button>
            </Link>
            <Link to="/register" onClick={() => setOpen(false)}>
              <Button fullWidth> Criar conta</Button>
            </Link>
            <Link to="/verificar" onClick={() => setOpen(false)}>
              <Button variant="secondary" fullWidth leftIcon={<ShieldCheck className="size-4" />}>
                Validar documento
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
