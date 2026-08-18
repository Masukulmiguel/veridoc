import { useEffect, useRef, useState, useCallback } from 'react'

interface UseParallaxOptions {
  speed?: number
  direction?: 'up' | 'down'
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(options: UseParallaxOptions = {}) {
  const { speed = 0.3, direction = 'up' } = options
  const ref = useRef<T>(null)
  const [offset, setOffset] = useState(0)

  const handleScroll = useCallback(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const elementCenter = rect.top + rect.height / 2
    const distanceFromCenter = elementCenter - windowHeight / 2
    const multiplier = direction === 'up' ? -1 : 1
    setOffset(distanceFromCenter * speed * multiplier)
  }, [speed, direction])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return { ref, offset }
}
