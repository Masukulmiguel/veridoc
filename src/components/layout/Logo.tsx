import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

interface LogoProps {
  variant?: 'light' | 'dark'
  to?: string
  className?: string
}

export function Logo({ variant = 'dark', to = '/', className }: LogoProps) {
  const mark = (
    <img
      src="/logotipo.png"
      alt=""
      aria-hidden="true"
      className="size-9 shrink-0 object-contain"
    />
  )

  const wordmark = (
    <span className="flex items-center gap-2.5">
      {mark}
      <span
        className={cn(
          'font-display text-xl font-bold tracking-tight',
          variant === 'dark' ? 'text-navy-900' : 'text-white',
        )}
      >
        Veri<span className="text-primary-600">Doc</span>
      </span>
    </span>
  )

  if (to) {
    return (
      <Link to={to} className={cn('inline-flex items-center', className)} aria-label="VeriDoc — Início">
        {wordmark}
      </Link>
    )
  }

  return <div className={cn('inline-flex items-center', className)}>{wordmark}</div>
}
