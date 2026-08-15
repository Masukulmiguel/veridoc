import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500/40 shadow-sm',
  secondary:
    'bg-navy-900 text-white hover:bg-navy-800 focus-visible:ring-navy-900/30 shadow-sm',
  outline:
    'border border-navy-200 bg-white text-navy-700 hover:border-navy-300 hover:bg-navy-50 focus-visible:ring-navy-300/30',
  ghost: 'text-navy-600 hover:bg-navy-100 hover:text-navy-900 focus-visible:ring-navy-300/30',
  danger:
    'bg-danger-600 text-white hover:bg-danger-700 focus-visible:ring-danger-500/40 shadow-sm',
  success:
    'bg-success-600 text-white hover:bg-success-700 focus-visible:ring-success-500/40 shadow-sm',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-55',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Spinner size="sm" className="text-inherit" /> : leftIcon}
      {children}
      {rightIcon}
    </button>
  )
}
