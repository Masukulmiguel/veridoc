import { CheckCircle2, Clock, ShieldOff, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { DocumentStatus } from '@/types/document'
import { cn } from '@/utils/cn'

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; tone: 'success' | 'danger' | 'warning' | 'neutral'; icon: typeof Clock }
> = {
  VALID: { label: 'Válido', tone: 'success', icon: CheckCircle2 },
  REVOKED: { label: 'Revogado', tone: 'danger', icon: XCircle },
  EXPIRED: { label: 'Expirado', tone: 'warning', icon: Clock },
  INVALID: { label: 'Inválido', tone: 'danger', icon: ShieldOff },
  PENDING: { label: 'Pendente', tone: 'neutral', icon: Clock },
}

interface DocumentStatusBadgeProps {
  status: DocumentStatus
  className?: string
}

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  return (
    <Badge tone={config.tone} className={cn('whitespace-nowrap', className)}>
      <Icon className="size-3.5" />
      {config.label}
    </Badge>
  )
}
