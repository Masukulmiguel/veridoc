import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'input-base min-h-24 resize-y',
        error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
        className,
      )}
      {...props}
    />
  )
}
