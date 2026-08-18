import type { ReactNode } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { cn } from '@/utils/cn'

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  duration?: number
}

export function FadeIn({ children, className, delay = 0, direction = 'up', duration = 700 }: FadeInProps) {
  const { ref, isVisible } = useScrollAnimation()

  const transforms: Record<string, string> = {
    up: 'translate-y-10',
    down: '-translate-y-10',
    left: 'translate-x-10',
    right: '-translate-x-10',
    none: '',
  }

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all ease-out will-change-transform',
        isVisible ? 'opacity-100' : 'opacity-0',
        isVisible ? '' : transforms[direction],
        className,
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
