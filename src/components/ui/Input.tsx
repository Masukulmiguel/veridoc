import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'input-base',
        error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
        className,
      )}
      {...props}
    />
  )
}
