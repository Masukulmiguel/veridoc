import { cn } from '@/utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClass = {
    sm: 'size-4 border-2',
    md: 'size-6 border-2',
    lg: 'size-9 border-[3px]',
  }[size]

  return (
    <span
      role="status"
      aria-label="A carregar"
      className={cn(
        'inline-block shrink-0 animate-spin rounded-full border-current border-t-transparent',
        sizeClass,
        className,
      )}
    />
  )
}
