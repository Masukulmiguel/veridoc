import { FilePlus2, ShieldCheck, UserPlus, LogIn, Landmark, UserCog, XCircle } from 'lucide-react'
import type { AuditEvent } from '@/types/institution'
import { AUDIT_EVENT_LABELS, formatRelativeTime } from '@/utils/format'
import { cn } from '@/utils/cn'

const EVENT_ICONS: Record<AuditEvent['action'], typeof FilePlus2> = {
  USER_CREATED: UserPlus,
  LOGIN: LogIn,
  DOCUMENT_CREATED: FilePlus2,
  DOCUMENT_SIGNED: FilePlus2,
  DOCUMENT_VERIFIED: ShieldCheck,
  DOCUMENT_REVOKED: XCircle,
  INSTITUTION_UPDATED: Landmark,
  USER_UPDATED: UserCog,
}

const EVENT_COLORS: Record<AuditEvent['action'], string> = {
  USER_CREATED: 'bg-primary-50 text-primary-600',
  LOGIN: 'bg-navy-100 text-navy-600',
  DOCUMENT_CREATED: 'bg-success-50 text-success-600',
  DOCUMENT_SIGNED: 'bg-success-50 text-success-600',
  DOCUMENT_VERIFIED: 'bg-success-50 text-success-600',
  DOCUMENT_REVOKED: 'bg-danger-50 text-danger-600',
  INSTITUTION_UPDATED: 'bg-warning-50 text-warning-600',
  USER_UPDATED: 'bg-warning-50 text-warning-600',
}

interface ActivityListProps {
  events: AuditEvent[]
  className?: string
}

export function ActivityList({ events, className }: ActivityListProps) {
  return (
    <ul className={cn('space-y-4', className)}>
      {events.map((event) => {
        const Icon = EVENT_ICONS[event.action] ?? FilePlus2
        return (
          <li key={event.id} className="flex items-start gap-3">
            <div
              className={cn(
                'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
                EVENT_COLORS[event.action] ?? 'bg-navy-100 text-navy-600',
              )}
            >
              <Icon className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-navy-800">
                <span className="font-medium">{AUDIT_EVENT_LABELS[event.action] ?? event.action}</span>
                <span className="text-navy-400"> por {event.actorName}</span>
              </p>
              <p className="text-xs text-navy-400">{formatRelativeTime(event.createdAt)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
