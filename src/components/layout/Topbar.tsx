import { Menu } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-navy-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-navy-600 hover:bg-navy-100 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="size-6" />
        </button>
        <div className="hidden sm:block">
          <p className="text-xs text-navy-400">Iniciou sessão como</p>
          <p className="text-sm font-medium text-navy-800">{user?.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => window.open('/verificar', '_blank')}>
          Verificar documento
        </Button>
      </div>
    </header>
  )
}
