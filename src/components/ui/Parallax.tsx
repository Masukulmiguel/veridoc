import type { ReactNode } from 'react'
import { useParallax } from '@/hooks/useParallax'
import { cn } from '@/utils/cn'

interface ParallaxProps {
  children: ReactNode
  className?: string
  speed?: number
  direction?: 'up' | 'down'
}

export function Parallax({ children, className, speed = 0.15, direction = 'up' }: ParallaxProps) {
  const { ref, offset } = useParallax({ speed, direction })

  return (
    <div ref={ref} className={cn('overflow-hidden', className)}>
      <div
        className="will-change-transform"
        style={{ transform: `translateY(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
