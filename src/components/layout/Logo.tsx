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
    <span className="flex items-center">
      {mark}
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
