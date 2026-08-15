import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  FilePlus2,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { Logo } from './Logo'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/user'
import { cn } from '@/utils/cn'

interface NavItem {
  label: string
  to: string
  icon: typeof LayoutDashboard
  roles?: UserRole[]
  end?: boolean
}

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Geral',
    items: [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Documentos',
    items: [
      { label: 'Documentos', to: '/documents', icon: FileText },
      { label: 'Emitir documento', to: '/documents/new', icon: FilePlus2, roles: ['ADMIN', 'ISSUER'] },
      { label: 'Validações', to: '/verifications', icon: ShieldCheck },
    ],
  },
  {
    label: 'Organização',
    items: [
      { label: 'Instituição', to: '/institution', icon: Landmark },
      { label: 'Utilizadores', to: '/users', icon: Users, roles: ['ADMIN'] },
      { label: 'Auditoria', to: '/audit', icon: ScrollText, roles: ['ADMIN'] },
    ],
  },
  {
    label: 'Sistema',
    items: [{ label: 'Definições', to: '/settings', icon: Settings }],
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function isActive(item: NavItem): boolean {
    if (item.end) return location.pathname === item.to
    return location.pathname.startsWith(item.to)
  }

  const content = (
    <div className="flex h-full flex-col bg-navy-950">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo variant="light" to="/dashboard" />
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-800 hover:text-white lg:hidden"
          aria-label="Fechar menu"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Menu principal">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter(
            (item) => !item.roles || (user && item.roles.includes(user.role)),
          )
          if (items.length === 0) return null
          return (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-navy-500">
                {group.label}
              </p>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive(item)
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-navy-300 hover:bg-navy-800 hover:text-white',
                      )}
                    >
                      <item.icon className="size-4.5 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-navy-800 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-600 font-display text-sm font-semibold text-white">
            {user?.name.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-navy-400">{user?.role.toLowerCase()}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-300 transition-colors hover:bg-navy-800 hover:text-white"
        >
          <LogOut className="size-4.5 shrink-0" />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">{content}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-72 animate-fade-in shadow-elevated">
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
