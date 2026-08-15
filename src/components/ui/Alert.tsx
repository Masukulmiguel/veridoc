import type { ReactNode } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/utils/cn'

type AlertTone = 'info' | 'success' | 'warning' | 'danger'

interface AlertProps {
  tone?: AlertTone
  title?: string
  children?: ReactNode
  className?: string
}

const TONE_CONFIG: Record<AlertTone, { icon: ReactNode; classes: string; iconColor: string }> = {
  info: {
    icon: <Info className="size-4" />,
    classes: 'border-primary-200 bg-primary-50 text-primary-800',
    iconColor: 'text-primary-600',
  },
  success: {
    icon: <CheckCircle2 className="size-4" />,
    classes: 'border-success-200 bg-success-50 text-success-700',
    iconColor: 'text-success-600',
  },
  warning: {
    icon: <AlertTriangle className="size-4" />,
    classes: 'border-warning-200 bg-warning-50 text-warning-700',
    iconColor: 'text-warning-600',
  },
  danger: {
    icon: <AlertCircle className="size-4" />,
    classes: 'border-danger-200 bg-danger-50 text-danger-700',
    iconColor: 'text-danger-600',
  },
}

export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  const config = TONE_CONFIG[tone]
  return (
    <div
      role="alert"
      className={cn('flex gap-3 rounded-xl border p-4 text-sm', config.classes, className)}
    >
      <span className={cn('mt-0.5 shrink-0', config.iconColor)}>{config.icon}</span>
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  )
}
