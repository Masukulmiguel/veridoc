import type { LabelHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  optional?: boolean
}

export function Label({ className, children, optional, ...props }: LabelProps) {
  return (
    <label
      className={cn('mb-1.5 block text-sm font-medium text-navy-700', className)}
      {...props}
    >
      {children}
      {optional && <span className="ml-1 font-normal text-navy-400">(opcional)</span>}
    </label>
  )
}
