import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

interface LogoProps {
  variant?: 'light' | 'dark'
  to?: string
  className?: string
}

export function Logo({ variant = 'dark', to = '/', className }: LogoProps) {
  const mark = (
    <svg viewBox="0 0 48 48" className="size-9 shrink-0" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill={variant === 'dark' ? '#0F172A' : '#FFFFFF'} />
      <path
        d="M24 8 38 14v9.2c0 7.8-5.2 13.6-14 16.8C15.2 36.8 10 31 10 23.2V14L24 8Z"
        fill="#2563EB"
      />
      <path
        d="M18.8 24l3.4 3.4 7-7"
        stroke={variant === 'dark' ? '#FFFFFF' : '#0F172A'}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
