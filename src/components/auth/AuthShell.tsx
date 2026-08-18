import type { ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-navy-50">
      <div className="hidden w-1/2 flex-col justify-between bg-navy-950 p-12 lg:flex">
        <Logo to="/" />
        <div className="max-w-md">
          <h2 className="font-display text-3xl font-bold leading-snug text-white">
            Confiança digital em cada documento.
          </h2>
          <p className="mt-3 text-navy-300">
            Emissão, assinatura e validação de documentos digitais com integridade verificável.
          </p>
          <ul className="mt-8 space-y-3">
            {['Hash criptográfico do conteúdo', 'Assinatura digital no backend', 'Página pública de validação'].map(
              (item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-navy-200">
                  <ShieldCheck className="size-5 shrink-0 text-success-500" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
        <p className="text-xs text-navy-500">
          © {new Date().getFullYear()} VeriDoc — Confiança digital em cada documento.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo to="/" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy-900">{title}</h1>
          <p className="mt-1.5 text-sm text-navy-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 border-t border-navy-200 pt-6 text-center text-sm text-navy-500">
            {footer}
          </div>
        </div>
      </div>
    </div>
  )
}
