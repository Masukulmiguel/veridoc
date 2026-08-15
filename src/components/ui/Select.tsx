import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export function Select({ className, error, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          'input-base appearance-none pr-9',
          error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-navy-400" />
    </div>
  )
}
