import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PublicNavbar } from './PublicNavbar'
import { Footer } from './Footer'

export function PublicLayout() {
  const location = useLocation()

  useEffect(() => {
    const hash = location.hash
    if (hash) {
      const element = document.querySelector(hash)
      if (element) element.scrollIntoView({ behavior: 'smooth' })
      return
    }
    window.scrollTo(0, 0)
  }, [location.pathname, location.hash])

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
