import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Logo } from './Logo'

const SECTIONS = [
  { title: 'Plataforma', links: [{ label: 'Validar documento', to: '/verificar' }] },
  {
    title: 'Acesso',
    links: [
      { label: 'Entrar', to: '/login' },
      { label: 'Criar conta', to: '/register' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-navy-950 text-navy-300">
      <div className="container-page grid gap-10 py-14 md:grid-cols-3">
        <div className="space-y-4">
          <Logo variant="light" to="/" />
          <p className="max-w-xs text-sm leading-relaxed">
            Confiança digital em cada documento. Emissão, assinatura e validação de documentos com
            integridade verificável.
          </p>
        </div>
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              {section.title}
            </h3>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
            Verificação
          </h3>
          <p className="flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4 text-success-500" />
            Documentos protegidos por hash e assinatura digital.
          </p>
        </div>
      </div>
      <div className="border-t border-navy-800">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} VeriDoc. Todos os direitos reservados.</p>
          <p>Feito com confiança digital em cada documento.</p>
        </div>
      </div>
    </footer>
  )
}
